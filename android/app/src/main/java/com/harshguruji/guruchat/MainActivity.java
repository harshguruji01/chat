package com.harshguruji.guruchat;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createGuruChatNotificationChannels();
    }

    private void createGuruChatNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            NotificationChannel messages = new NotificationChannel(
                "guruchat_messages",
                "Guru Chat Messages",
                NotificationManager.IMPORTANCE_HIGH
            );
            messages.setDescription("Real-time private and group message alerts");
            messages.enableVibration(true);

            NotificationChannel calls = new NotificationChannel(
                "guruchat_calls",
                "Guru Chat Voice & Video Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            calls.setDescription("Incoming voice and video call alerts");
            calls.enableVibration(true);

            NotificationChannel conferences = new NotificationChannel(
                "guruchat_conferences",
                "Guru Chat Group Conferences",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            conferences.setDescription("Meeting invitations and reminders");

            manager.createNotificationChannel(messages);
            manager.createNotificationChannel(calls);
            manager.createNotificationChannel(conferences);
        }
    }
}
