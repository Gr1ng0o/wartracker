import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaInput, mediaEdit, extensionFor, MAX_MEDIA_BYTES, MEDIA_TYPES } from "../lib/media-policy.ts";
const sample={name:"Tour 1.jpg",mimeType:"image/jpeg",size:1024};
test("photos, vidéos et PDF acceptés",()=>{for(const mimeType of MEDIA_TYPES){assert.equal(mediaInput.safeParse({...sample,mimeType}).success,true);assert.ok(extensionFor(mimeType));}});
test("refuse fichiers vides, trop gros, SVG et HTML",()=>{for(const change of [{size:0},{size:-1},{size:MAX_MEDIA_BYTES+1},{size:1.5},{mimeType:"image/svg+xml"},{mimeType:"text/html"},{name:"   "}])assert.equal(mediaInput.safeParse({...sample,...change}).success,false);assert.equal(mediaInput.safeParse({...sample,size:MAX_MEDIA_BYTES}).success,true);});
test("classement strict et identifiant de partie optionnel",()=>{assert.equal(mediaInput.parse(sample).phase,"general");assert.equal(mediaInput.safeParse({...sample,phase:"t5",gameId:null}).success,true);assert.equal(mediaInput.safeParse({...sample,phase:"t6"}).success,false);});
test("édition ne peut pas remplacer le chemin ni publier une URL arbitraire",()=>{assert.equal(mediaEdit.safeParse({caption:"Une décision utile",gameId:null,phase:"deployment"}).success,true);assert.equal(mediaEdit.safeParse({path:"other/private.jpg"}).success,false);assert.equal(mediaEdit.safeParse({url:"https://example.com"}).success,false);assert.equal(mediaEdit.safeParse({caption:"x".repeat(1001)}).success,false);});
