"use client";
import { ModeToggle } from "@/components/mode-toggle";
import { useGetSalesQuery, useDeleteSaleMutation } from "@/store/api/apiStore";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertCircle, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";
import { toast } from "sonner";

export default function SalesList() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetSalesQuery({
    page: 1,
    page_size: 10,
    is_received: true,
  });

  const [deleteSale] = useDeleteSaleMutation();
  const [deletingStates, setDeletingStates] = useState({});

  const handleDeleteSale = async (saleUuid: any, saleNumber: any) => {
    try {
      setDeletingStates((prev) => ({ ...prev, [saleUuid]: "deleting" }));

      await deleteSale(saleUuid).unwrap();

      setDeletingStates((prev) => ({ ...prev, [saleUuid]: "success" }));

      toast.success(`Sale #${saleNumber} has been successfully deleted.`);

      setTimeout(() => {
        setDeletingStates((prev) => {
          const newState = { ...prev };
          delete newState[saleUuid];
          return newState;
        });
      }, 2000);
    } catch (error: any) {
      setDeletingStates((prev) => ({ ...prev, [saleUuid]: "error" }));

      let errorMessage = `Failed to delete sale #${saleNumber}.`;

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(errorMessage);

      setTimeout(() => {
        setDeletingStates((prev) => {
          const newState = { ...prev };
          delete newState[saleUuid];
          return newState;
        });
      }, 3000);
    }
  };

  const handleViewSale = (saleUuid: any) => {
    router.push(`/sales/${saleUuid}`);
  };

  const getSaleRowClass = (saleUuid: any) => {
    const state = deletingStates[saleUuid];
    switch (state) {
      case "deleting":
        return "opacity-50 bg-yellow-50 dark:bg-yellow-900/20";
      case "error":
        return "bg-red-50 dark:bg-red-900/20";
      case "success":
        return "bg-green-50 dark:bg-green-900/20";
      default:
        return "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer";
    }
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) return <Loading />;

  // Handle API error
  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Sales Page</h1>
          <ModeToggle />
        </div>

        <Alert className="border-red-200 bg-red-50 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>Failed to load sales data. Please try again.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Sales Page</h1>
        <ModeToggle />
      </div>

      <div className="flex justify-end mb-4 mt-4">
        <Button
          className="px-4 py-2 rounded"
          onClick={() => (window.location.href = "/sales/add")}
        >
          Add a Sale
        </Button>
      </div>

      {data?.results?.length === 0 ? (
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No sales found. Click "Add a Sale" to create your first sale.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex justify-center">
          <Table className="w-5/6 mx-auto">
            <TableCaption>
              List of recent sales • Click on a row to view details
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Sale Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Warehouse Name</TableHead>
                <TableHead>Is Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.results.map((sale: any) => (
                <TableRow
                  key={sale.uuid}
                  className={getSaleRowClass(sale.uuid)}
                >
                  <TableCell className="font-medium">{sale.number}</TableCell>
                  <TableCell>{sale.customer?.name || "N/A"}</TableCell>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.total_price}</TableCell>
                  <TableCell>{sale.warehouse?.name || "N/A"}</TableCell>
                  <TableCell>{sale.is_received ? "✅" : "❌"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSale(sale.uuid);
                        }}
                        disabled={deletingStates[sale.uuid] === "deleting"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletingStates[sale.uuid] === "deleting"}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deletingStates[sale.uuid] === "deleting" ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete sale #
                              {sale.number}? This action cannot be undone and
                              it will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteSale(sale.uuid, sale.number)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
