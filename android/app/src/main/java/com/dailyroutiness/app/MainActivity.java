package com.dailyroutiness.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Prevent white flash by setting the WebView background to transparent during initialization
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.setBackgroundColor(Color.TRANSPARENT);
            }
        } catch (Exception e) {
            // Safe fallback in case the bridge or webview is not fully initialized
        }
    }
}
