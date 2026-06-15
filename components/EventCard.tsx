"use client";

import { Card, CardContent, Chip, Link } from "@heroui/react";
import type { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
  showStatus?: boolean;
  showRegistration?: boolean;
}

const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  draft: "default",
  review: "warning",
  approved: "accent",
  published: "success",
  active: "accent",
  completed: "default",
  cancelled: "danger",
};

const audienceLabels: Record<string, string> = {
  public: "Public",
  member_only: "Members Only",
  exclusive: "Exclusive",
};

export function EventCard({ event, showStatus = true, showRegistration = true }: EventCardProps) {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const spotsLeft = event.capacity - event.registered;
  const isFull = spotsLeft <= 0;

  return (
    <Link href={`/events/${event.$id}`}>
      <Card className="border border-default-200 hover:border-primary transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-3">
          {event.image && (
            <div className="aspect-video rounded-lg overflow-hidden bg-default-100">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
              {showStatus && event.status && (
                <Chip size="sm" variant="soft" color={statusColors[event.status] || "default"}>
                  {event.status}
                </Chip>
              )}
            </div>

            <p className="text-sm text-default-500 line-clamp-2">{event.description}</p>

            <div className="flex flex-wrap gap-2 text-xs text-default-400">
              <span>{eventDate.toLocaleDateString()}</span>
              <span>•</span>
              <span>{event.time}</span>
              <span>•</span>
              <span>{event.venue}</span>
            </div>

            <div className="flex items-center justify-between">
              <Chip size="sm" variant="soft">
                {audienceLabels[event.audience] || event.audience}
              </Chip>

              {showRegistration && (
                <div className="text-right">
                  {event.price === 0 ? (
                    <span className="text-sm font-medium text-success">Free</span>
                  ) : (
                    <span className="text-sm font-medium">₹{event.price}</span>
                  )}
                  <p className="text-xs text-default-400">
                    {isFull ? "Full" : `${spotsLeft} spots left`}
                  </p>
                </div>
              )}
            </div>

            {event.isFeatured && (
              <Chip size="sm" color="warning" variant="soft">
                Featured
              </Chip>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
