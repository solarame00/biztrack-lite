
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomeDashboard } from "@/components/dashboard/home-dashboard"
import { AddExpenseForm } from "@/components/forms/add-expense-form"
import { AddCashForm } from "@/components/forms/add-cash-form"
// AddAssetForm import removed
import { FilterControls } from "@/components/dashboard/filter-controls"
import { HistoryView } from "@/components/dashboard/history-view" 
import { Landmark, Receipt, DollarSignIcon, History } from "lucide-react" 

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">BizTrack Lite</h1>
        <ThemeToggle />
      </header>

      <Tabs defaultValue="home" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="home">
            <Landmark className="mr-2 h-5 w-5" />
            Home
          </TabsTrigger>
          <TabsTrigger value="add-expense">
            <Receipt className="mr-2 h-5 w-5" />
            Add Expense
          </TabsTrigger>
          <TabsTrigger value="add-cash">
             <DollarSignIcon className="mr-2 h-5 w-5"/>
            Add Cash
          </TabsTrigger>
          {/* "Add Asset" TabTrigger removed */}
          <TabsTrigger value="history">
            <History className="mr-2 h-5 w-5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
              <CardDescription>Your financial snapshot. Apply filters to view specific periods or dates.</CardDescription>
            </CardHeader>
            <CardContent>
              <FilterControls />
              <HomeDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-expense">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Log New Expense</CardTitle>
              <CardDescription>Keep track of your spending.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddExpenseForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-cash">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Record Cash Transaction</CardTitle>
              <CardDescription>Log cash in or out.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddCashForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* "Add Asset" TabsContent removed */}

        <TabsContent value="history">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="text-2xl">Transaction History</CardTitle>
                <CardDescription>Review your past cash and expense transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <FilterControls /> 
                <HistoryView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
