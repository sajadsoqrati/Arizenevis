import { Response } from "express";

export interface NewHelpRequestNotification {
  type: "NEW_HELP_REQUEST";
  message: string;
  helpRequest: unknown;
}

interface SseClient {
  userId: string;
  res: Response;
}

class AdminNotificationService {
  private clients = new Set<SseClient>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.pingTimer = setInterval(() => this.pingClients(), 25_000);
  }

  private pingClients(): void {
    for (const client of this.clients) {
      try {
        client.res.write(": ping\n\n");
      } catch {
        this.clients.delete(client);
      }
    }
  }

  addClient(userId: string, res: Response): void {
    const client: SseClient = { userId, res };
    this.clients.add(client);

    res.on("close", () => {
      this.clients.delete(client);
    });

    this.sendEvent(res, "connected", {
      message: "اتصال اعلان‌های مدیر برقرار شد",
    });
  }

  isAnyAdminOnline(): boolean {
    return this.clients.size > 0;
  }

  notifyNewHelpRequest(helpRequest: unknown): void {
    if (!this.isAnyAdminOnline()) {
      return;
    }

    const notification: NewHelpRequestNotification = {
      type: "NEW_HELP_REQUEST",
      message: "درخواست مشاوره جدید ثبت شد",
      helpRequest,
    };

    for (const client of this.clients) {
      try {
        this.sendEvent(client.res, "notification", notification);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  private sendEvent(res: Response, event: string, data: unknown): void {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

export const adminNotificationService = new AdminNotificationService();
