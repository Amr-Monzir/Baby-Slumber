package com.babysleep.whitenoise;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioService")
public class AudioServicePlugin extends Plugin {
    
    private BroadcastReceiver mediaControlReceiver;
    
    @Override
    public void load() {
        // Register broadcast receiver to listen for media control events
        mediaControlReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (action == null) return;
                
                JSObject data = new JSObject();
                
                switch (action) {
                    case AudioService.BROADCAST_PLAY:
                        data.put("action", "play");
                        notifyListeners("mediaControl", data);
                        break;
                    case AudioService.BROADCAST_PAUSE:
                        data.put("action", "pause");
                        notifyListeners("mediaControl", data);
                        break;
                    case AudioService.BROADCAST_STOP:
                        data.put("action", "stop");
                        notifyListeners("mediaControl", data);
                        break;
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(AudioService.BROADCAST_PLAY);
        filter.addAction(AudioService.BROADCAST_PAUSE);
        filter.addAction(AudioService.BROADCAST_STOP);
        
        LocalBroadcastManager.getInstance(getContext()).registerReceiver(mediaControlReceiver, filter);
    }
    
    @Override
    protected void handleOnDestroy() {
        if (mediaControlReceiver != null) {
            LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(mediaControlReceiver);
        }
        super.handleOnDestroy();
    }
    
    @PluginMethod
    public void startService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), AudioService.class);
        serviceIntent.setAction(AudioService.ACTION_PLAY);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void stopService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), AudioService.class);
        serviceIntent.setAction(AudioService.ACTION_STOP);
        getContext().startService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void updatePlayState(PluginCall call) {
        boolean isPlaying = call.getBoolean("isPlaying", false);
        
        Intent serviceIntent = new Intent(getContext(), AudioService.class);
        serviceIntent.setAction(isPlaying ? AudioService.ACTION_PLAY : AudioService.ACTION_PAUSE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        
        JSObject ret = new JSObject();
        ret.put("updated", true);
        call.resolve(ret);
    }
}
