using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace MneApp;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm());
    }
}

internal sealed class MainForm : Form
{
    private const string VirtualHost = "mne.local";
    private const string StartUrl = "https://" + VirtualHost + "/MNE/index.html";
    private const string BaseTitle = "漫画ネームエディタ";

    private readonly WebView2 _web = new() { Dock = DockStyle.Fill };

    public MainForm()
    {
        Text = BaseTitle;
        Width = 1400;
        Height = 900;
        StartPosition = FormStartPosition.CenterScreen;
        try
        {
            Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        }
        catch
        {
            // アイコンが取れなくても起動は妨げない
        }
        Controls.Add(_web);
        Load += async (_, _) => await InitializeWebViewAsync();
    }

    private async Task InitializeWebViewAsync()
    {
        // ユーザーデータ(localStorage等)はexeと同じ場所に置き、コピーだけで持ち運べるようにする
        var dataFolder = Path.Combine(AppContext.BaseDirectory, "userdata");
        CoreWebView2Environment env;
        try
        {
            env = await CoreWebView2Environment.CreateAsync(userDataFolder: dataFolder);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "WebView2 ランタイムを初期化できませんでした。\n" +
                "Microsoft Edge WebView2 Runtime をインストールしてください。\n\n" + ex.Message,
                BaseTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
            return;
        }

        await _web.EnsureCoreWebView2Async(env);
        var core = _web.CoreWebView2;

        // 埋め込みリソースを https://mne.local/... として返す
        // (セキュアオリジン扱いになるため localStorage とファイルAPIがWeb版と同じに動く)
        core.AddWebResourceRequestedFilter("https://" + VirtualHost + "/*", CoreWebView2WebResourceContext.All);
        core.WebResourceRequested += (_, e) => ServeEmbedded(env, e);

        // 同梱ファイルを直接読むため ServiceWorker は不要。
        // 登録したままだと更新時に古いキャッシュを掴むので無効化する。
        await core.AddScriptToExecuteOnDocumentCreatedAsync(
            "try{Object.defineProperty(navigator,'serviceWorker',{get:()=>undefined});}catch(e){}");

        var settings = core.Settings;
        settings.AreDefaultContextMenusEnabled = true;
        settings.IsStatusBarEnabled = false;
        settings.AreBrowserAcceleratorKeysEnabled = true;

        core.DocumentTitleChanged += (_, _) =>
        {
            var title = core.DocumentTitle;
            Text = string.IsNullOrWhiteSpace(title) ? BaseTitle : title;
        };

        // 外部リンクは既定のブラウザで開く
        core.NewWindowRequested += (_, e) =>
        {
            e.Handled = true;
            OpenExternally(e.Uri);
        };
        core.NavigationStarting += (_, e) =>
        {
            if (e.Uri.StartsWith("https://" + VirtualHost + "/", StringComparison.OrdinalIgnoreCase)) return;
            if (e.Uri.StartsWith("about:", StringComparison.OrdinalIgnoreCase)) return;
            e.Cancel = true;
            OpenExternally(e.Uri);
        };

        core.Navigate(StartUrl);
    }

    private static void ServeEmbedded(CoreWebView2Environment env, CoreWebView2WebResourceRequestedEventArgs e)
    {
        var path = new Uri(e.Request.Uri).AbsolutePath.TrimStart('/');
        if (path.Length == 0) path = "MNE/index.html";

        var stream = typeof(MainForm).Assembly.GetManifestResourceStream("web/" + path);
        if (stream is null)
        {
            e.Response = env.CreateWebResourceResponse(null, 404, "Not Found", "");
            return;
        }

        var headers =
            "Content-Type: " + ContentTypeOf(path) + "\r\n" +
            "Cache-Control: no-store";
        e.Response = env.CreateWebResourceResponse(stream, 200, "OK", headers);
    }

    private static string ContentTypeOf(string path) => Path.GetExtension(path).ToLowerInvariant() switch
    {
        ".html" => "text/html; charset=utf-8",
        ".js" => "text/javascript; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".json" => "application/json; charset=utf-8",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".svg" => "image/svg+xml",
        ".ico" => "image/x-icon",
        _ => "application/octet-stream",
    };

    private static void OpenExternally(string uri)
    {
        if (!uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase)) return;
        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(uri) { UseShellExecute = true });
        }
        catch
        {
            // 開けなくてもアプリは継続する
        }
    }
}
