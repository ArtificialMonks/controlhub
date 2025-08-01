import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Theme System Test</h1>
        <ThemeToggle />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Light Theme Colors</CardTitle>
            <CardDescription>Testing light theme color variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary text-primary-foreground rounded">
              Primary Color (#003cff)
            </div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded">
              Secondary Color
            </div>
            <div className="p-4 bg-muted text-muted-foreground rounded">
              Muted Color (#9ca3af)
            </div>
            <Button variant="default">Default Button</Button>
            <Button variant="outline">Outline Button</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dark Theme Colors</CardTitle>
            <CardDescription>Testing dark theme color variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-accent text-accent-foreground rounded">
              Accent Color (#0066ff)
            </div>
            <div className="p-4 bg-destructive text-destructive-foreground rounded">
              Error Color (#ef4444)
            </div>
            <div className="p-4 border border-border rounded">
              Border Color
            </div>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="destructive">Destructive Button</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme Features</CardTitle>
            <CardDescription>Testing theme switching functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background border border-border rounded">
              Background adapts to theme
            </div>
            <div className="p-4 text-foreground">
              Text color adapts to theme
            </div>
            <div className="p-4 bg-card text-card-foreground border border-border rounded">
              Card colors adapt to theme
            </div>
            <p className="text-sm text-muted-foreground">
              Switch themes using the toggle above to see instant changes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme System Status</CardTitle>
          <CardDescription>Verification of theme implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">✅ Implemented Features:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• next-themes integration</li>
                <li>• CSS variables for light/dark themes</li>
                <li>• System preference detection</li>
                <li>• Theme persistence in localStorage</li>
                <li>• SSR-safe implementation</li>
                <li>• Instant theme switching</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🎨 Color Palette:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Light: #ffffff background, #000000 text</li>
                <li>• Dark: #0a0b1f background, #ffffff text</li>
                <li>• Primary: #003cff → #0066ff gradient</li>
                <li>• Success: #22c55e</li>
                <li>• Error: #ef4444</li>
                <li>• Warning: #FAAD14</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
