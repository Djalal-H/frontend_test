"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AddSaleForm from "@/components/addSaleForm";
import { ModeToggle } from "@/components/mode-toggle";
import Loading from "@/app/loading";

export default function AddSalePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <Loading />;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
        <div className="p-4">
            <ModeToggle />
            <AddSaleForm />
        </div>
    </div>
  )
}
