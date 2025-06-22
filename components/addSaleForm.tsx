"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetCustomersQuery,
  useGetWarehousesQuery,
  useGetWarehouseInventoryQuery,
  useCreateSaleMutation,
} from "@/store/api/apiStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSaleRequest, SaleLine, CustomerPayment } from "@/types/sales";
import Loading from "@/app/loading";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const saleSchema = yup.object().shape({
  customer: yup.string().required("Customer is required"),
  warehouse: yup.string().required("Warehouse is required"),
  date: yup.string().required("Date is required"),
  lines: yup.array().of(
    yup.object().shape({
      product: yup.string().required("Product is required"),
      quantity: yup.number().min(1).required(),
      unit_price: yup.number().min(0).required(),
      discount_price: yup.number().min(0).nullable(),
    })
  ),
  customer_payment: yup
    .object()
    .shape({
      amount: yup.number().min(0),
      method: yup.string(),
      note: yup.string(),
    })
    .nullable(),
});

const AddSaleForm: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const saleId = useRef<string>(crypto.randomUUID());

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(saleSchema),
    defaultValues: {
      customer: "",
      warehouse: "",
      date: new Date().toISOString().split("T")[0],
      lines: [],
      customer_payment: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const warehouseId = watch("warehouse");
  const includePayment = watch("customer_payment") !== null;

  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
  } = useGetCustomersQuery({});
  const {
    data: warehouses = [],
    isLoading: warehousesLoading,
    error: warehousesError,
  } = useGetWarehousesQuery({});
  const {
    data: inventory = [],
    refetch: refetchInventory,
    error: inventoryError,
  } = useGetWarehouseInventoryQuery(warehouseId, {
    skip: !warehouseId,
  });

  const [createSale, { isLoading: createSaleLoading }] =
    useCreateSaleMutation();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (warehouseId) {
      refetchInventory();
      setValue("lines", []);
    }
  }, [warehouseId, refetchInventory, setValue, status, router]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const onSubmit = async (data: any) => {
    try {
      setNotification(null); // Clear any existing notifications

      if (!includePayment) data.customer_payment = null;

      const saleData = {
        uuid: saleId.current,
        date: data.date,
        customer: data.customer,
        warehouse: data.warehouse,
        discount_price: data.lines.reduce(
          (sum: number, line: any) => sum + (line.discount_price || 0),
          0
        ),
        is_received: true,
        lines: data.lines.map((line: any) => ({
          uuid: crypto.randomUUID(),
          product: line.product,
          quantity: line.quantity,
          unit_price: line.unit_price,
          discount_price: line.discount_price || 0,
        })),
        customer_payment: data.customer_payment
          ? {
              uuid: crypto.randomUUID(),
              customer: data.customer,
              amount: data.customer_payment.amount,
              note: data.customer_payment.note,
              method: data.customer_payment.method,
            }
          : {},
      };

      await createSale(saleData).unwrap();

      setNotification({
        type: "success",
        message: "Sale created successfully!",
      });

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push("/sales");
      }, 1500);
    } catch (error: any) {
      let errorMessage =
        "An unexpected error occurred while creating the sale.";

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setNotification({
        type: "error",
        message: errorMessage,
      });
    }
  };

  const getProductDisplay = (productRes: any) => {
    return `${productRes.product.name} (${productRes.product.price})`;
  };

  // function to get the name of the item based on the uuid
  const getItemName = (uuid: string, items: any[]) => {
    const item = items.find((i) => i.uuid === uuid);
    return item ? item.name : null;
  };

  function getProductName(uuid: string, products: any[]) {
    const inventoryItem = products.find((p) => p.product.uuid === uuid);
    return inventoryItem ? inventoryItem.product.name : null;
  }

  // Handle loading states and errors
  if (customersLoading || warehousesLoading) {
    return <Loading />;
  }

  // Handle API errors
  if (customersError || warehousesError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load required data. Please refresh the page and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Notification Alert */}
      {notification && (
        <Alert
          className={`mb-6 ${
            notification.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              notification.type === "success"
                ? "text-green-800"
                : "text-red-800"
            }
          >
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Error Alert */}
      {inventoryError && warehouseId && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Failed to load inventory for the selected warehouse. Please try
            selecting a different warehouse.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-4">Customer *</Label>
                <Controller
                  control={control}
                  name="customer"
                  render={({ field }) => (
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        {getItemName(field.value, customers.results) ||
                          "Select Customer"}
                      </SelectTrigger>
                      <SelectContent>
                        {customers.results?.map((c: any) => (
                          <SelectItem key={c.uuid} value={c.uuid}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customer && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.customer.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-4">Warehouse *</Label>
                <Controller
                  control={control}
                  name="warehouse"
                  render={({ field }) => (
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        {getItemName(field.value, warehouses.results) ||
                          "Select Warehouse"}
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.results?.map((w: any) => (
                          <SelectItem key={w.uuid} value={w.uuid}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.warehouse && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.warehouse.message}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-4">Date *</Label>
                <Input type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Sale Lines</Label>
                <Button
                  type="button"
                  onClick={() => {
                    append({
                      product: "",
                      quantity: 1,
                      unit_price: 0,
                      discount_price: 0,
                    });
                  }}
                  disabled={!warehouseId || createSaleLoading}
                >
                  Add Line
                </Button>
              </div>
              {fields.map((line, index) => (
                <div key={line.id} className="grid grid-cols-5 gap-2">
                  <Controller
                    control={control}
                    name={`lines.${index}.product`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          const selected = inventory.results?.find(
                            (p: any) => p.product.uuid === val
                          );
                          const price = Number(selected?.product?.price);
                          setValue(
                            `lines.${index}.unit_price`,
                            isNaN(price) ? 0 : price
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <span className="truncate">
                          {getProductName(field.value, inventory.results) ||
                            "Select Product"}
                          </span>
                        </SelectTrigger>
                        <SelectContent >
                          {inventory.results?.map((p: any) => (
                            <SelectItem
                              key={p.product.uuid}
                              value={p.product.uuid}
                            >
                              {getProductDisplay(p)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    type="number"
                    {...register(`lines.${index}.quantity`)}
                    placeholder="Quantity"
                  />
                  <Input
                    type="number"
                    {...register(`lines.${index}.unit_price`)}
                    placeholder="Unit Price"
                  />
                  <Input
                    type="number"
                    {...register(`lines.${index}.discount_price`)}
                    placeholder="Discount Price"
                  />
                  <Button
                    className="w-1/2"
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash />
                  </Button>
                </div>
              ))}
              {errors.lines && (
                <p className="text-sm text-red-600">{errors.lines.message}</p>
              )}
            </div>

            <div>
              <Label>Include Payment</Label>
              <input
                type="checkbox"
                checked={includePayment}
                onChange={(e) =>
                  setValue(
                    "customer_payment",
                    e.target.checked
                      ? { amount: 0, method: "cash", note: "" }
                      : null
                  )
                }
              />
              {includePayment && (
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <Input
                    type="number"
                    {...register("customer_payment.amount")}
                    placeholder="Amount"
                  />
                  <Input
                    {...register("customer_payment.method")}
                    placeholder="Method"
                  />
                  <Input
                    {...register("customer_payment.note")}
                    placeholder="Note"
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={createSaleLoading}>
              {createSaleLoading ? "Creating..." : "Create Sale"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSaleForm;
