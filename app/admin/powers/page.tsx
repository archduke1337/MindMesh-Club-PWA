"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { powerService } from "@/lib/powers";
import type { Power, UserPower } from "@/lib/types";
import { Shield, Search, Loader2, Check, X } from "lucide-react";

interface PowerWithHolders extends Power {
  holders: UserPower[];
}

export default function AdminPowersPage() {
  const { user, loading: authLoading } = useAuth();
  const { isRole } = usePermissions();
  const router = useRouter();
  const [powers, setPowers] = useState<PowerWithHolders[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPower, setSelectedPower] = useState<PowerWithHolders | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    if (!authLoading && user && !isRole("admin")) router.push("/unauthorized");
  }, [user, authLoading, isRole, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const allPowers = await powerService.getAll();
        const granted = await powerService.getAllGranted();

        const powersWithHolders = allPowers.map((power) => ({
          ...power,
          holders: granted.filter((g) => g.powerId === power.$id),
        }));

        setPowers(powersWithHolders);
      } catch (error) {
        console.error("Failed to load powers:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user && isRole("admin")) load();
  }, [user, authLoading, isRole]);

  const handleRevoke = async (userPowerId: string) => {
    try {
      await powerService.revoke(userPowerId);
      setPowers((prev) =>
        prev.map((p) => ({
          ...p,
          holders: p.holders.filter((h) => h.$id !== userPowerId),
        }))
      );
    } catch (error) {
      console.error("Failed to revoke:", error);
    }
  };

  const filtered = powers.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isRole("admin")) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Power Management</h1>
        <p className="text-default-500">View and manage granted powers</p>
      </div>

      <Input
        placeholder="Search powers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        startContent={<Search className="w-4 h-4 text-default-400" />}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <Card className="border border-default-200">
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">No Powers Found</h3>
            <p className="text-default-500 mt-1">No powers match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((power) => (
            <Card
              key={power.$id}
              className="border border-default-200 hover:border-primary transition-colors cursor-pointer"
              onClick={() => {
                setSelectedPower(power);
                onOpen();
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{power.displayName}</h3>
                    <p className="text-sm text-default-400">{power.name}</p>
                  </div>
                  <Chip size="sm" variant="soft">
                    {power.holders.length} holders
                  </Chip>
                </div>

                {power.description && (
                  <p className="text-sm text-default-500 line-clamp-2">{power.description}</p>
                )}

                <div className="flex gap-2">
                  <Chip size="sm" variant="flat">{power.category}</Chip>
                  <Chip size="sm" variant="flat">{power.scope}</Chip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div>
              <h3>{selectedPower?.displayName}</h3>
              <p className="text-sm text-default-400">{selectedPower?.name}</p>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedPower && (
              <div className="space-y-4">
                {selectedPower.description && (
                  <p className="text-default-500">{selectedPower.description}</p>
                )}

                <div className="flex gap-2">
                  <Chip size="sm" variant="soft">{selectedPower.category}</Chip>
                  <Chip size="sm" variant="soft">{selectedPower.scope}</Chip>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    Current Holders ({selectedPower.holders.length})
                  </h4>
                  {selectedPower.holders.length === 0 ? (
                    <p className="text-sm text-default-500">No one has this power yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPower.holders.map((holder) => (
                        <div
                          key={holder.$id}
                          className="flex items-center justify-between p-2 rounded-lg bg-default-100"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              User: {holder.userId.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-default-400">
                              Granted: {new Date(holder.grantedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            onClick={() => handleRevoke(holder.$id!)}
                            startContent={<X className="w-4 h-4" />}
                          >
                            Revoke
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
