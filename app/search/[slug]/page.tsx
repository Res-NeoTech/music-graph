import { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } | Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await Promise.resolve(params);

    return {
        title: slug
    }
}

export default async function SearchPage({ params }: { params: { slug: string } | Promise<{ slug: string }>;}) {
    const { slug } = await Promise.resolve(params);
    return (<h1>{slug}</h1>)
}