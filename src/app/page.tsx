import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { HomeDashboard } from "@/components/dashboard/home-dashboard"
import { AddExpenseForm } from "@/components/forms/add-expense-form"
import { AddCashForm } from "@/components/forms/add-cash-form"
import { AddAssetForm } from "@/components/forms/add-asset-form"
import { FilterControls } from "@/components/dashboard/filter-controls"
import { Landmark, Package, Receipt } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">BizTrack Lite</h1>
        <ThemeToggle />
      </header>

      <Tabs defaultValue="home" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="home">
            <Landmark className="mr-2 h-5 w-5" />
            Home
          </TabsTrigger>
          <TabsTrigger value="add-expense">
            <Receipt className="mr-2 h-5 w-5" />
            Add Expense
          </TabsTrigger>
          <TabsTrigger value="add-cash">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Add Cash
          </TabsTrigger>
          <TabsTrigger value="add-asset">
            <Package className="mr-2 h-5 w-5" />
            Add Asset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Dashboard Overview</CardTitle>
              <CardDescription>Your financial snapshot.</CardDescription>
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

        <TabsContent value="add-asset">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Add New Asset</CardTitle>
              <CardDescription>Record your valuable items.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddAssetForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
