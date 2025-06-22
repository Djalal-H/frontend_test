"use client";
import { useParams, useRouter } from "next/navigation";
import { useGetSaleQuery, useGetSaleLinesQuery } from "@/store/api/apiStore";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Package,
  User,
  Warehouse,
} from "lucide-react";
import Loading from "@/app/loading";
import { ModeToggle } from "@/components/mode-toggle";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleUuid = params.uuid as string;
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const {
    data: saleData,
    isLoading: isSaleLoading,
    error: saleError,
  } = useGetSaleQuery(saleUuid);

  const {
    data: saleLinesData,
    isLoading: isLinesLoading,
    error: linesError,
  } = useGetSaleLinesQuery(saleUuid);

  if (isSaleLoading || isLinesLoading) {
    return <Loading />;
  }

  if (saleError || linesError) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Error Loading Sale
          </h2>
          <p className="text-gray-600 mb-4">
            {saleError
              ? "Failed to load sale information"
              : "Failed to load sale lines"}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const calculateLineTotal = (quantity: any, unitPrice: any, discountPrice = 0) => {
    return (quantity * unitPrice - discountPrice).toFixed(2);
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: any) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Sale #{saleData?.number}</h1>
          <p className="text-gray-600 mt-1">Sale Details and Line Items</p>
        </div>
        <ModeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sale Information Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Sale Information
              </CardTitle>
              <CardDescription>General details about this sale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">
                      Sale Number:
                    </span>
                    <span className="font-semibold">{saleData?.number}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Customer:
                    </span>
                    <span className="font-semibold">
                      {saleData?.customer?.name || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date:
                    </span>
                    <span className="font-semibold">
                      {formatDate(saleData?.date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Discount:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(saleData?.discount_price || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">
                      Total Price:
                    </span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(saleData?.total_price || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">Status:</span>
                    <Badge
                      variant={saleData?.is_received ? "default" : "secondary"}
                    >
                      {saleData?.is_received ? "Received" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-600 flex items-center gap-1">
                      <Warehouse className="h-4 w-4" />
                      Warehouse:
                    </span>
                    <span className="font-semibold">
                      {saleData?.warehouse?.name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Information Card */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Method:</span>
                <Badge variant="outline">
                  {saleData?.customer_payment?.method || "N/A"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Amount:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(saleData?.customer_payment?.amount || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Sale Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sale Line Items</CardTitle>
          <CardDescription>
            Detailed breakdown of products in this sale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              {saleLinesData?.length
                ? `${saleLinesData.length} item(s) in this sale`
                : "No items found in this sale"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Line Discount</TableHead>
                <TableHead className="text-right font-semibold">
                  Total Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saleLinesData?.map((line: any, index: number) => (
                <TableRow key={line.id || index}>
                  <TableCell className="font-medium">
                    {line.product?.name || "Unknown Product"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{line.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(line.unit_price || 0)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(line.discount_price || 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      calculateLineTotal(
                        line.quantity || 0,
                        line.unit_price || 0,
                        line.discount_price || 0
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {!saleLinesData?.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No line items found for this sale
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
