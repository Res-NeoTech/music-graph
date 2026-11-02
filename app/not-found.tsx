import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MusicGraphLogo } from "@/components/music-graph-logo";
import { House } from "lucide-react";

export default function NotFound() {
    return (
        <section className="flex min-h-screen flex-col items-center justify-center gap-12 px-4 text-center">
            <MusicGraphLogo aria-hidden className="sm:h-25 h-12" />
            <h1 className="text-4xl font-bold sm:text-7xl text-primary">404 - Not Found</h1>
            <p className="max-w-md">The element you are looking for was probably deleted or never even existed.</p>
            <Button
                variant="default"
                render={<Link href="/" />}
                nativeButton={false}
            >
                <House />
                Return to home
            </Button>
        </section>
    );
}