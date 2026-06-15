"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { eventService } from "@/lib/events";
import { ticketService } from "@/lib/tickets";
import type { Event, Ticket } from "@/lib/types";
import { getErrorMessage } from "@/lib/errorHandler";
import { toast } from "sonner";
import { Button, Card, CardContent, Chip } from "@heroui/react";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  TagIcon,
  ArrowLeftIcon,
  StarIcon,
  CrownIcon,
} from "lucide-react";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const eventId = params.id as string;

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventService.getById(eventId);
      setEvent(data);

      if (user) {
        const registered = await eventService.isRegistered(eventId, user.$id);
        setIsRegistered(registered);
        if (registered) {
          const t = await ticketService.getByUserAndEvent(user.$id, eventId);
          setTicket(t);
        }
      }
    } catch (error) {
      console.error("Error loading event:", error);
      toast.error("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please login to register for events");
      router.push("/login");
      return;
    }

    if (!event) return;

    setRegistering(true);
    try {
      await eventService.register(eventId, user.$id, user.name, user.email);

      toast.success("Registration successful!");

      setIsRegistered(true);
      loadEvent();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-default-500">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="text-center py-12 space-y-4">
            <p className="text-4xl">😕</p>
            <h2 className="text-xl font-bold">Event Not Found</h2>
            <p className="text-default-500">This event may have been removed or doesn&apos;t exist.</p>
            <Button variant="primary" onPress={() => router.push("/events")}>
              Browse Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <Button
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
        className="mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <div className="relative rounded-2xl overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-64 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {event.isFeatured && (
              <Chip className="bg-yellow-500 text-white font-bold">
                <StarIcon className="w-3 h-3 mr-1" />
                Featured
              </Chip>
            )}
            {event.isPremium && (
              <Chip className="bg-purple-600 text-white font-bold">
                <CrownIcon className="w-3 h-3 mr-1" />
                Premium
              </Chip>
            )}
            <Chip className="bg-white/20 backdrop-blur-md text-white">
              {event.eventTypeId}
            </Chip>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">About This Event</h2>
              <p className="text-default-600 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {(event.tags || []).length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(event.tags || []).map((tag, index) => (
                    <Chip key={index} size="sm" variant="primary">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-default-600">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-default-600">
                  <ClockIcon className="w-5 h-5 text-purple-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-3 text-default-600">
                  <MapPinIcon className="w-5 h-5 text-purple-500" />
                  <span>{event.venue}, {event.location}</span>
                </div>
                <div className="flex items-center gap-3 text-default-600">
                  <UsersIcon className="w-5 h-5 text-purple-500" />
                  <span>{event.registered} / {event.capacity} registered</span>
                </div>
              </div>

              <div className="border-t pt-4">
                {event.discountPrice && event.discountPrice < event.price ? (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-purple-600">${event.discountPrice}</span>
                    <span className="text-lg text-default-400 line-through">${event.price}</span>
                  </div>
                ) : event.price === 0 ? (
                  <span className="text-3xl font-bold text-green-600">Free</span>
                ) : (
                  <span className="text-3xl font-bold text-purple-600">${event.price}</span>
                )}
              </div>

              {event.capacity > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-default-500">Spots remaining</span>
                    <span className="font-semibold">{event.capacity - event.registered}</span>
                  </div>
                  <div className="w-full bg-default-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold"
                size="lg"
                isPending={registering}
                isDisabled={isRegistered || (event.capacity > 0 && event.registered >= event.capacity)}
                onPress={handleRegister}
              >
                {isRegistered ? "Already Registered" : "Register Now"}
              </Button>

              {isRegistered && ticket && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">Your Ticket</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Code: {ticket.ticketCode}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Status: {ticket.status}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Organizer</h3>
              <div className="flex items-center gap-3">
                <img
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span className="font-medium">{event.organizerName}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
