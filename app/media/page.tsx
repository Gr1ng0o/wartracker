import MediaLibrary from "./media-library";
export const metadata={title:"Médiathèque"};
export default async function Page({searchParams}:{searchParams:Promise<{gameId?:string}>}) { const {gameId}=await searchParams; return <MediaLibrary initialGameId={gameId||""}/>; }
