
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, FileText, DollarSign } from "lucide-react" 

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useData } from "@/contexts/DataContext"
import { formatCurrency } from "@/lib/currency-utils";


const formSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(["in", "out"], {
    required_error: "You need to select a transaction type.",
  }),
  name: z.string().min(1, { message: "Please provide a name or label." }),
  note: z.string().optional(),
  date: z.date({
    required_error: "A date is required.",
  }),
})

export function AddCashForm() {
  const { toast } = useToast()
  const { addTransaction, currency } = useData();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "" as unknown as number, 
      type: "in",
      name: "",
      note: "",
      date: new Date(),
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    addTransaction({
      type: values.type === "in" ? "cash-in" : "cash-out",
      amount: values.amount,
      name: values.name,
      note: values.note,
      date: values.date,
    });
    toast({
      title: "Cash Transaction Added",
      description: `${values.name} (${values.type === 'in' ? 'inflow' : 'outflow'}) of ${formatCurrency(values.amount, currency)} logged.`,
      className: "bg-primary text-primary-foreground", 
    })
    form.reset({
        amount: "" as unknown as number,
        type: "in",
        name: "",
        note: "",
        date: new Date(),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currency})</FormLabel> {/* Display currency symbol */}
              <FormControl>
                <Input type="number" placeholder="e.g., 100.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />
              </FormControl>
              <FormDescription>
                Enter the transaction amount.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="in" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Cash In
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="out" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Cash Out
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name / Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Client Payment, Bank Withdrawal" {...field} />
              </FormControl>
              <FormDescription>
                Enter a descriptive name for this cash transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the date of the transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note" 
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., For project X, Reimbursed travel expenses"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add any relevant details for this transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto">
         <DollarSign className="mr-2 h-5 w-5"/>
          Add Cash Transaction
        </Button>
      </form>
    </Form>
  )
}
