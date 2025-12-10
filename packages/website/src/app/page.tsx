import CoreConcept from '../components/CoreConcept';
import Features from '../components/Features';
import InteractiveHero from '../components/InteractiveHero';
import InteractiveShowcase from '../components/InteractiveShowcase';
import Philosophy from '../components/Philosophy';
import UsageGuide from '../components/UsageGuide';

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <InteractiveHero />
      
        <Philosophy />
        <CoreConcept />
        <InteractiveShowcase />
        <Features />
        <UsageGuide />
      
    </main>
  );
}
