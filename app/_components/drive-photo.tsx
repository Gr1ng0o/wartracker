"use client";
import { useState } from "react";

export function drivePhotoSource(value: string) {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:") return null;
        if (url.hostname === "drive.google.com") {
            const id = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || url.searchParams.get("id");
            if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return null;
            return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;
        }
        return /\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(url.href) ? url.href : null;
    } catch { return null; }
}
export default function DrivePhoto({ url, label }: { url: string; label: string }) {
    const [failed, setFailed] = useState(false);
    const source = drivePhotoSource(url);
    if (!source) return null;
    return <figure className="drive-photo">
        {!failed && <img src={source} alt={label} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} style={{width:"100%",maxHeight:500,objectFit:"contain"}} />}
        {failed && <p>Aperçu indisponible. Vérifie que le fichier est une image et que son partage autorise la lecture via le lien.</p>}
        <a href={url} target="_blank" rel="noreferrer">Ouvrir l’original sur Drive →</a>
    </figure>;
}
export function DriveLinkField({ name, label, initialValue = "", photo = false }: {name:string;label:string;initialValue?:string;photo?:boolean}) {
    const [url, setUrl] = useState(initialValue);
    return <div><label>{label}<input name={name} type="url" value={url} onChange={event => setUrl(event.target.value)} /></label>{photo && <DrivePhoto key={url} url={url} label={label} />}</div>;
}
