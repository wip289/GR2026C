import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Download, Search } from "lucide-react";
import { toast } from "sonner";

export default function EmployerDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterBoothType, setFilterBoothType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const employers = [
    {
      id: 1,
      company: "Tech Solutions Indonesia",
      industry: "Technology",
      contact: "hr@techsolutions.id",
      phone: "+62 812 3456 7890",
      boothHistory: ["Main (2024)", "Standard (2023)"],
      sponsorshipHistory: "Gold (2024)",
      lastParticipation: "2024",
    },
    {
      id: 2,
      company: "Finance Plus",
      industry: "Finance",
      contact: "events@financeplus.id",
      phone: "+62 813 4567 8901",
      boothHistory: ["Main (2024)", "Main (2023)"],
      sponsorshipHistory: "Platinum (2024)",
      lastParticipation: "2024",
    },
    {
      id: 3,
      company: "Marketing Hub Indonesia",
      industry: "Marketing",
      contact: "hello@marketinghub.id",
      phone: "+62 814 5678 9012",
      boothHistory: ["Standard (2024)", "Standard (2022)"],
      sponsorshipHistory: "Gold (2023)",
      lastParticipation: "2024",
    },
    {
      id: 4,
      company: "HR Innovations",
      industry: "Human Resources",
      contact: "info@hrinnovations.id",
      phone: "+62 815 6789 0123",
      boothHistory: ["Standard (2023)", "Standard (2022)"],
      sponsorshipHistory: "Silver (2023)",
      lastParticipation: "2023",
    },
    {
      id: 5,
      company: "Digital Ventures",
      industry: "Technology",
      contact: "sponsor@digitalventures.id",
      phone: "+62 816 7890 1234",
      boothHistory: ["Main (2023)", "Standard (2022)"],
      sponsorshipHistory: "Gold (2023)",
      lastParticipation: "2023",
    },
    {
      id: 6,
      company: "Global Consulting",
      industry: "Consulting",
      contact: "events@globalconsulting.id",
      phone: "+62 817 8901 2345",
      boothHistory: ["Standard (2024)"],
      sponsorshipHistory: "Silver (2024)",
      lastParticipation: "2024",
    },
  ];

  const filteredEmployers = employers.filter((employer) => {
    const matchesSearch =
      employer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employer.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = filterIndustry === "all" || employer.industry === filterIndustry;
    const matchesBoothType = filterBoothType === "all" || employer.boothHistory.some((booth) => booth.includes(filterBoothType));
    const matchesYear = filterYear === "all" || employer.lastParticipation === filterYear;

    return matchesSearch && matchesIndustry && matchesBoothType && matchesYear;
  });

  const handleExport = () => {
    const csvContent = [
      ["Company", "Industry", "Contact", "Phone", "Booth History", "Sponsorship History", "Last Participation"],
      ...filteredEmployers.map((emp) => [
        emp.company,
        emp.industry,
        emp.contact,
        emp.phone,
        emp.boothHistory.join("; "),
        emp.sponsorshipHistory,
        emp.lastParticipation,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employer-database-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Employer database exported successfully!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Employer Database</h1>
          </div>
          <p className="text-gray-600">Access previous employers for sponsorship and marketing outreach</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
            <CardDescription>Find employers by name, industry, or participation history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by company name or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Industry</label>
                  <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Booth Type</label>
                  <Select value={filterBoothType} onValueChange={setFilterBoothType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Booth Types</SelectItem>
                      <SelectItem value="Main">Main Booth</SelectItem>
                      <SelectItem value="Standard">Standard Booth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Year</label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleExport} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4" />
                    Export as CSV
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredEmployers.length}</span> of{" "}
            <span className="font-semibold">{employers.length}</span> employers
          </p>
        </div>

        {/* Employer Table */}
        <Card>
          <CardContent className="pt-6">
            {filteredEmployers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Booth History</TableHead>
                      <TableHead>Sponsorship</TableHead>
                      <TableHead>Last Participation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployers.map((employer) => (
                      <TableRow key={employer.id}>
                        <TableCell className="font-medium">{employer.company}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employer.industry}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{employer.contact}</p>
                            <p className="text-gray-600">{employer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {employer.boothHistory.map((booth, idx) => (
                              <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                                {booth}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-100 text-purple-800">{employer.sponsorshipHistory}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{employer.lastParticipation}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No employers found matching your filters.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Employers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employers.length}</div>
              <p className="text-xs text-gray-500 mt-2">In database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <p className="text-xs text-gray-500 mt-2">Represented</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Repeat Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">4</div>
              <p className="text-xs text-gray-500 mt-2">Multiple years</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Sponsors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">6</div>
              <p className="text-xs text-gray-500 mt-2">Have sponsored</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
