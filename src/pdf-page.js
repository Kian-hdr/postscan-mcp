import {getDocumentProxy,getResolvedPDFJS} from 'unpdf';
import UPNG from 'upng-js';
const MAX_BYTES=8*1024*1024,MAX_PIXELS=5500000,MAX_OUTPUT=4*1024*1024;
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=16000)s+=String.fromCharCode(...bytes.subarray(i,i+16000));return btoa(s);}
export function rgba(image){const {width:w,height:h,data,kind}=image;if(!Number.isSafeInteger(w*h)||w*h>MAX_PIXELS)throw Error('image_pixel_limit');const expected=kind===1?Math.ceil(w/8)*h:kind===2?w*h*3:kind===3?w*h*4:0;if(!expected||data.length<expected)throw Error('image_buffer_incomplete');const out=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,o=p*4;if(kind===1){const stride=Math.ceil(w/8),v=(data[y*stride+(x>>3)]&(128>>(x&7)))?255:0;out[o]=out[o+1]=out[o+2]=v;out[o+3]=255;}else if(kind===2){out[o]=data[p*3];out[o+1]=data[p*3+1];out[o+2]=data[p*3+2];out[o+3]=255;}else if(kind===3){const a=data[p*4+3]/255;out[o]=Math.round(data[p*4]*a+255*(1-a));out[o+1]=Math.round(data[p*4+1]*a+255*(1-a));out[o+2]=Math.round(data[p*4+2]*a+255*(1-a));out[o+3]=255;}else throw Error('image_kind_unsupported');}return out;}
export async function extractPdfPage(bytes,pageNumber){
 if(bytes.byteLength>MAX_BYTES)throw Error('pdf_byte_limit');
 const pdf=await getDocumentProxy(new Uint8Array(bytes),{isOffscreenCanvasSupported:false,isImageDecoderSupported:false,maxImageSize:MAX_PIXELS,useWasm:false,disableFontFace:true,useSystemFonts:false,stopAtErrors:true});
 try{
  if(pdf.numPages>100||pageNumber<1||pageNumber>pdf.numPages)throw Error('page_out_of_range');
  const page=await pdf.getPage(pageNumber),text=await page.getTextContent(),ops=await page.getOperatorList(),{OPS}=await getResolvedPDFJS();
  const warnings=[],images=[];let output=0;
  const imageOps=new Set([OPS.paintImageXObject,OPS.paintInlineImageXObject,OPS.paintImageMaskXObject,OPS.paintImageXObjectRepeat,OPS.paintImageMaskXObjectRepeat,OPS.paintImageMaskXObjectGroup,OPS.paintInlineImageXObjectGroup,OPS.paintSolidColorImageMask]);
  for(let i=0;i<ops.fnArray.length;i++){
   const op=ops.fnArray[i];if(!imageOps.has(op))continue;
   if(op!==OPS.paintImageXObject&&op!==OPS.paintInlineImageXObject){warnings.push('image_mask_or_group_requires_full_render');continue;}
   let img;if(op===OPS.paintInlineImageXObject)img=ops.argsArray[i][0];else{const id=ops.argsArray[i][0];img=await Promise.race([new Promise(resolve=>(id.startsWith('g_')?page.commonObjs:page.objs).get(id,resolve)),new Promise((_,reject)=>setTimeout(()=>reject(Error('image_decode_timeout')),5000))]);}
   if(!img?.data||!img.width||!img.height){warnings.push('image_decode_incomplete');continue;}
   const pixels=rgba(img);const png=new Uint8Array(UPNG.encode([pixels.buffer],img.width,img.height,0));output+=png.length;if(output>MAX_OUTPUT||images.length>=8)throw Error('image_output_limit');images.push({type:'image',mimeType:'image/png',data:b64(png),width:img.width,height:img.height});
  }
  // Embedded image pixels are source evidence, not a reconstructed page layout.
  const nativeText=text.items.filter(x=>typeof x.str==='string').map(x=>x.str+(x.hasEOL?'\n':' ')).join('');
  const manifest={page:pageNumber,total_pages:pdf.numPages,next_page:pageNumber<pdf.numPages?pageNumber+1:null,native_text:nativeText,image_count:images.length,source_view:'scan layers composited onto white plus native text; background layers remain separate; placement, clipping and vector overlays are not rendered',page_rotation:page.rotate,warnings:[...new Set(warnings)],requires_visual_review:true};
  if(!images.length&&!nativeText.trim())manifest.warnings.push('no_readable_content_recovered');
  return {manifest,images};
 }finally{await pdf.loadingTask.destroy();}
}
export async function readPdfPage(url,page){
 const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port||!/^sdmnt[a-z0-9-]*\.oaiusercontent\.com$/.test(u.hostname)||!/^\/files\/[a-f0-9-]+\/raw$/.test(u.pathname))throw Error('source_url_not_allowed');
 const r=await fetch(u.toString(),{redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('source_download_failed');if(Number(r.headers.get('content-length')||0)>MAX_BYTES)throw Error('pdf_byte_limit');
 const reader=r.body.getReader();let size=0;const chunks=[];for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>MAX_BYTES){await reader.cancel();throw Error('pdf_byte_limit');}chunks.push(v.value);}const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
 return extractPdfPage(bytes,page);
}
