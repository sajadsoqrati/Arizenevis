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
  private presenceClients = new Set<Response>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.pingTimer = setInterval(() => this.pingClients(), 25_000);
  }

  private pingClients(): void {
    for (const client of this.clients) {
      try {
        if (client.res.destroyed || client.res.writableEnded) {
          this.removeClient(client);
        } else {
          client.res.write(": ping\n\n");
        }
      } catch {
        this.removeClient(client);
      }
    }
    for (const res of this.presenceClients) {
      try {
        if (res.destroyed || res.writableEnded) this.presenceClients.delete(res);
        else res.write(": ping\n\n");
      } catch {
        this.presenceClients.delete(res);
      }
    }
  }

  private removeClient(client: SseClient): void {
    if (this.clients.delete(client) && !this.isAnyAdminOnline()) {
      this.broadcastPresence();
    }
  }

  private broadcastPresence(): void {
    for (const res of this.presenceClients) {
      try {
        this.sendEvent(res, "presence", { online: this.isAnyAdminOnline() });
      } catch {
        this.presenceClients.delete(res);
      }
    }
  }

  addPresenceClient(res: Response): void {
    this.presenceClients.add(res);
    const remove = () => this.presenceClients.delete(res);
    res.on("close", remove);
    res.on("error", remove);
    this.sendEvent(res, "presence", { online: this.isAnyAdminOnline() });
  }

  addClient(userId: string, res: Response): void {
    const client: SseClient = { userId, res };
    const wasOnline = this.isAnyAdminOnline();
    this.clients.add(client);

    res.on("close", () => this.removeClient(client));
    res.on("error", () => this.removeClient(client));
    if (!wasOnline) this.broadcastPresence();

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
        this.removeClient(client);
      }
    }
  }

  private sendEvent(res: Response, event: string, data: unknown): void {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

export const adminNotificationService = new AdminNotificationService();
