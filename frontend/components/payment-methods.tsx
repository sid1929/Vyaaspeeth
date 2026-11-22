"use client"
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react"
import type { PaymentMethod } from "@/lib/api"
import { cn } from "@/lib/utils"

const METHODS: { name: PaymentMethod; icon: typeof Wallet; hint: string }[] = [
  { name: "UPI", icon: Smartphone, hint: "GPay, PhonePe, Paytm" },
  { name: "Credit Card", icon: CreditCard, hint: "Visa, Mastercard, RuPay" },
  { name: "Debit Card", icon: CreditCard, hint: "All major banks" },
  { name: "Net Banking", icon: Landmark, hint: "50+ banks" },
  { name: "Wallet", icon: Wallet, hint: "Paytm, Amazon Pay" },
]

export function PaymentMethods({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
      {METHODS.map((m) => (
        <button key={m.name} type="button" role="radio" aria-checked={value === m.name} onClick={() => onChange(m.name)}
          className={cn("flex items-center gap-3 rounded-2xl border p-4 text-left transition-all", value === m.name ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "hover:border-primary/50")}>
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl", value === m.name ? "bg-primary text-primary-foreground" : "bg-muted")}><m.icon className="h-5 w-5" /></span>
          <span><span className="block font-semibold">{m.name}</span><span className="text-xs text-muted-foreground">{m.hint}</span></span>
        </button>
      ))}
    </div>
  )
}
