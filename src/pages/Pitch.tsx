import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  MapPin, 
  Wifi, 
  Brain, 
  ArrowRight,
  CheckCircle2,
  Building2,
  DollarSign
} from 'lucide-react';

export default function Pitch() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-background/95 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {/* Hero Section */}
          <section className="relative py-16 px-8 bg-gradient-to-br from-primary/10 via-background to-background">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Hotel Operations Intelligence
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
                    Real-Time Staff Dispatch for{' '}
                    <span className="text-gradient-primary">Luxury Hotels</span>
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    An academic-grade dispatch system using WiFi positioning, weighted scoring algorithms, 
                    and real-time state management to optimize staff allocation and guest satisfaction.
                  </p>
                  <div className="flex gap-4">
                    <Button size="lg" className="gap-2">
                      <Building2 className="w-5 h-5" />
                      Schedule Demo
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2">
                      View Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Video Demo */}
                <div className="relative">
                  <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                    <video 
                      className="w-full aspect-video object-cover"
                      controls
                      poster="/placeholder.svg"
                    >
                      <source src="/videos/pitch-demo.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                    Live Demo
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Key Metrics */}
          <section className="py-16 px-8 bg-card/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-display font-semibold text-center mb-12">
                Proven Results
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: Clock, value: '40%', label: 'Faster Response', sublabel: 'Average task acknowledgment' },
                  { icon: Users, value: '25%', label: 'Staff Efficiency', sublabel: 'Improved utilization' },
                  { icon: TrendingUp, value: '60%', label: 'Less Rerouting', sublabel: 'Optimal first assignment' },
                  { icon: DollarSign, value: '$2.4M', label: 'Annual Savings', sublabel: 'Per 500-room property' },
                ].map((metric, i) => (
                  <Card key={i} className="text-center p-6 bg-card/50 border-border/50">
                    <metric.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                    <div className="text-3xl font-bold text-foreground mb-1">{metric.value}</div>
                    <div className="text-sm font-medium text-foreground">{metric.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{metric.sublabel}</div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          
          {/* Core Technology */}
          <section className="py-16 px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-display font-semibold text-center mb-4">
                Academic-Grade Technology
              </h2>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                Built on research from MIT CSAIL, Stanford CS, and IEEE publications
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                  <CardHeader>
                    <Wifi className="w-10 h-10 text-info mb-2" />
                    <CardTitle className="font-display">WiFi Positioning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      RADAR Fingerprinting with WKNN (k=4) for sub-zone accuracy without hardware investment.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Log-Distance Path Loss Model
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Bayesian Zone Inference
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Stanford α=4.0 for Indoors
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                  <CardHeader>
                    <Brain className="w-10 h-10 text-primary mb-2" />
                    <CardTitle className="font-display">Weighted Scoring</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Multi-factor dispatch algorithm: S = λ₁P + λ₂R + λ₃L + λ₄D + λ₅M
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Proximity via Zone Graph
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Reliability & Load Balancing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Priority-Adaptive Weights
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                  <CardHeader>
                    <MapPin className="w-10 h-10 text-success mb-2" />
                    <CardTitle className="font-display">Real-Time State</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Supabase Realtime with PostgreSQL for millisecond state sync across all clients.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        WebSocket Subscriptions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Optimistic UI Updates
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Event Sourcing Pattern
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* System Architecture */}
          <section className="py-16 px-8 bg-card/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-display font-semibold text-center mb-12">
                System Architecture
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Data Flow */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Core Entities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: 'Tasks', desc: 'Towels, cleaning, maintenance, room service requests' },
                        { name: 'Workers', desc: 'Staff with roles, skills, reliability metrics' },
                        { name: 'Zones', desc: 'Spatial areas with category and adjacency graph' },
                        { name: 'Assignments', desc: 'Task-worker pairings with state machine' },
                        { name: 'Events', desc: 'Immutable audit log for analytics' },
                      ].map((entity, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div>
                            <div className="font-medium text-foreground">{entity.name}</div>
                            <div className="text-sm text-muted-foreground">{entity.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Task Lifecycle */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="font-display text-lg">Task Lifecycle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { status: 'NEW', color: 'bg-info', desc: 'Task created, scoring workers' },
                        { status: 'ASSIGNED', color: 'bg-purple-500', desc: 'Worker notified, awaiting ack' },
                        { status: 'IN_PROGRESS', color: 'bg-primary', desc: 'Worker accepted, en route' },
                        { status: 'COMPLETED', color: 'bg-success', desc: 'Task finished, metrics updated' },
                        { status: 'REROUTED', color: 'bg-warning', desc: 'Reassigned after timeout/decline' },
                      ].map((stage, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Badge className={`${stage.color} text-white font-mono text-xs`}>
                            {stage.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{stage.desc}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-20 px-8 bg-gradient-to-t from-primary/5 to-background">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-display font-bold mb-6">
                Ready to Transform Your Operations?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join leading luxury hotels using data-driven dispatch to deliver exceptional guest experiences.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="gap-2 px-8">
                  <Building2 className="w-5 h-5" />
                  Request Pilot Program
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  Download Whitepaper
                </Button>
              </div>
            </div>
          </section>
          
          {/* Footer */}
          <footer className="py-8 px-8 border-t border-border/50 bg-card/30">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                © 2026 Grand Hotel Dispatch System — Version 4.0
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>Based on MIT CSAIL & Stanford CS Research</span>
                <span>•</span>
                <span>IEEE Publications</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
