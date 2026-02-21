import { DiscoveryPlatform } from "@/components/discovery/DiscoveryPlatform";
import { mockCars } from "@/lib/mockData";

export default function HomePage() {
  return (
    <main className="container py-8 px-4 md:px-0">
      <DiscoveryPlatform initialCars={mockCars} />
    </main>
  );
}
