package com.babysleep.whitenoise;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.support.v4.media.MediaMetadataCompat;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.media.app.NotificationCompat.MediaStyle;

public class AudioService extends Service {
    
    public static final String CHANNEL_ID = "BabySleepAudioChannel";
    public static final String ACTION_PLAY = "com.babysleep.whitenoise.PLAY";
    public static final String ACTION_PAUSE = "com.babysleep.whitenoise.PAUSE";
    public static final String ACTION_STOP = "com.babysleep.whitenoise.STOP";
    
    // Broadcast actions to notify the WebView
    public static final String BROADCAST_PLAY = "com.babysleep.whitenoise.BROADCAST_PLAY";
    public static final String BROADCAST_PAUSE = "com.babysleep.whitenoise.BROADCAST_PAUSE";
    public static final String BROADCAST_STOP = "com.babysleep.whitenoise.BROADCAST_STOP";
    
    private MediaSessionCompat mediaSession;
    private boolean isPlaying = false;
    
    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        setupMediaSession();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Baby Sleep Audio",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background audio playback for Baby Sleep");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private void setupMediaSession() {
        mediaSession = new MediaSessionCompat(this, "BabySleepSession");
        
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                // Notify JavaScript to play audio
                sendBroadcastToWebView(BROADCAST_PLAY);
            }
            
            @Override
            public void onPause() {
                // Notify JavaScript to pause audio
                sendBroadcastToWebView(BROADCAST_PAUSE);
            }
            
            @Override
            public void onStop() {
                // Notify JavaScript to stop audio
                sendBroadcastToWebView(BROADCAST_STOP);
            }
        });
        
        mediaSession.setMetadata(new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, "Brown Noise")
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, "BabySleep")
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Soothing Sounds")
            .build());
        
        mediaSession.setActive(true);
        updatePlaybackState();
    }
    
    private void sendBroadcastToWebView(String action) {
        Intent intent = new Intent(action);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }
    
    public void updatePlayingState(boolean playing) {
        isPlaying = playing;
        updatePlaybackState();
        updateNotification();
    }
    
    private void updatePlaybackState() {
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_STOP |
                PlaybackStateCompat.ACTION_PLAY_PAUSE
            );
        
        if (isPlaying) {
            stateBuilder.setState(PlaybackStateCompat.STATE_PLAYING, 0, 1.0f);
        } else {
            stateBuilder.setState(PlaybackStateCompat.STATE_PAUSED, 0, 0f);
        }
        
        mediaSession.setPlaybackState(stateBuilder.build());
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        boolean shouldBroadcast = false;
        String broadcastAction = null;
        
        if (intent != null) {
            String action = intent.getAction();
            boolean fromNotification = intent.getBooleanExtra("fromNotification", false);
            
            if (ACTION_PLAY.equals(action)) {
                isPlaying = true;
                if (fromNotification) {
                    broadcastAction = BROADCAST_PLAY;
                    shouldBroadcast = true;
                }
            } else if (ACTION_PAUSE.equals(action)) {
                isPlaying = false;
                if (fromNotification) {
                    broadcastAction = BROADCAST_PAUSE;
                    shouldBroadcast = true;
                }
            } else if (ACTION_STOP.equals(action)) {
                if (fromNotification) {
                    sendBroadcastToWebView(BROADCAST_STOP);
                }
                stopSelf();
                return START_NOT_STICKY;
            }
        } else {
            isPlaying = true;
        }
        
        updatePlaybackState();
        
        Notification notification = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(1, notification);
        }
        
        // Send broadcast after starting foreground to avoid ANR
        if (shouldBroadcast && broadcastAction != null) {
            sendBroadcastToWebView(broadcastAction);
        }
        
        return START_STICKY;
    }
    
    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent, PendingIntent.FLAG_IMMUTABLE
        );
        
        // Play/Pause action - mark as from notification
        Intent playPauseIntent = new Intent(this, AudioService.class);
        playPauseIntent.setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        playPauseIntent.putExtra("fromNotification", true);
        PendingIntent playPausePendingIntent = PendingIntent.getService(
            this, 1, playPauseIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        // Stop action - mark as from notification
        Intent stopIntent = new Intent(this, AudioService.class);
        stopIntent.setAction(ACTION_STOP);
        stopIntent.putExtra("fromNotification", true);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this, 2, stopIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Brown Noise")
            .setContentText(isPlaying ? "Playing soothing sounds" : "Paused")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
            .setContentIntent(openPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setShowWhen(false)
            .addAction(
                isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                isPlaying ? "Pause" : "Play",
                playPausePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Stop",
                stopPendingIntent
            )
            .setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1));
        
        return builder.build();
    }
    
    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(1, buildNotification());
        }
    }
    
    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }
    
    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
