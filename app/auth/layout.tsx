import Image from "next/image";
import watchtogether from "@/public/watch-together.jpg";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex w-full h-full">
            <div className="w-3/5 h-screen bg-blue-100">
                <Image src={watchtogether} alt="watch-together" className="object-fill w-full h-full" />
            </div>
            <div className="w-2/5 h-screen bg-white flex flex-col items-center justify-center">
                <h1 className="text-2xl pt-24 font-bold text-blue-700">WatchToGamer</h1>
                {children}
                <h1 className="text-sm pb-24 font-bold text-gray-400">Réalisé par A. Gaël, L. Alexis, R. Lucas, R. Nicolas</h1>
            </div>
        </div>
    );
}
