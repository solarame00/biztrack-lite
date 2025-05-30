
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Receipt } from "lucide-react" 

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
  name: z.string().min(2, {
    message: "Expense name must be at least 2 characters.",
  }),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  note: z.string().optional(),
  date: z.date({
    required_error: "A date is required.",
  }),
})

export function AddExpenseForm() {
  const { toast } = useToast()
  const { addTransaction, currency, currentProjectId } = useData(); 

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "" as unknown as number, 
      note: "",
      date: new Date(),
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
     if (!currentProjectId) {
      toast({
        title: "Error",
        description: "No project selected. Cannot add expense.",
        variant: "destructive",
      });
      return;
    }
    addTransaction({
      type: "expense",
      name: values.name,
      amount: values.amount,
      date: values.date,
      note: values.note,
    });
    toast({
      title: "Expense Added",
      description: `${values.name} expense of ${formatCurrency(values.amount, currency)} logged successfully.`, 
      className: "bg-primary text-primary-foreground", 
    })
    form.reset({ 
      name: "",
      amount: "" as unknown as number,
      note: "",
      date: new Date(),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expense Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Facebook Ads, Office Printer Ink" {...field} />
              </FormControl>
              <FormDescription>
                Enter a descriptive name for the expense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({currency})</FormLabel> 
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 50.00" 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} 
                  value={field.value === undefined ? "" : field.value}
                />
              </FormControl>
              <FormDescription>
                Enter the expense amount.
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
                Select the date of the expense.
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
                  placeholder="Add any relevant details..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Add a short note for this expense.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto" disabled={!currentProjectId}>
          <Receipt className="mr-2 h-5 w-5" />
          Add Expense
        </Button>
      </form>
    </Form>
  )
}
