"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Trash2, X } from "lucide-react";

type ConfirmDeleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  itemLabel?: string;
  count?: number;
  confirmDisabled?: boolean;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = "Confirm deletion",
  description,
  confirmLabel,
  itemLabel,
  count,
  confirmDisabled = false,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const computedDescription =
    description ||
    (typeof count === "number"
      ? `Are you sure you want to delete ${count} item${count === 1 ? "" : "s"}? This action cannot be undone.`
      : "Are you sure you want to delete this item? This action cannot be undone.");

  const computedConfirmLabel =
    confirmLabel ||
    (typeof count === "number"
      ? `Delete ${count} item${count === 1 ? "" : "s"}`
      : itemLabel
        ? `Delete ${itemLabel}`
        : "Delete");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[1001] w-[min(520px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 rounded-t-2xl bg-gradient-to-br from-red-600 to-red-700 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-white">{title}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-white/90">{computedDescription}</Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 transition hover:bg-white/25">
              <X className="h-4 w-4 text-white" />
            </Dialog.Close>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This action cannot be undone.
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Dialog.Close className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                disabled={confirmDisabled}
                onClick={onConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {computedConfirmLabel}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
