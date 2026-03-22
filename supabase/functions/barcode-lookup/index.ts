import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    if (!barcode || typeof barcode !== 'string') {
      return new Response(JSON.stringify({ error: 'Barcode is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try Open Food Facts — prefer Russian locale
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=ru&cc=ua`);
    const offData = await offRes.json();

    if (offData.status === 1 && offData.product) {
      const p = offData.product;
      // Prefer Russian name, then Ukrainian, then generic
      const name = p.product_name_ru || p.product_name_uk || p.product_name || p.product_name_en || null;
      const description = p.generic_name_ru || p.generic_name_uk || p.generic_name || p.categories || null;
      return new Response(JSON.stringify({
        found: true,
        source: 'openfoodfacts',
        name,
        description,
        brand: p.brands || null,
        image_url: p.image_url || p.image_front_url || null,
        barcode,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try Open Beauty Facts
    const obfRes = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json?lc=ru&cc=ua`);
    const obfData = await obfRes.json();

    if (obfData.status === 1 && obfData.product) {
      const p = obfData.product;
      const name = p.product_name_ru || p.product_name_uk || p.product_name || null;
      const description = p.generic_name_ru || p.generic_name_uk || p.generic_name || p.categories || null;
      return new Response(JSON.stringify({
        found: true,
        source: 'openbeautyfacts',
        name,
        description,
        brand: p.brands || null,
        image_url: p.image_url || null,
        barcode,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ found: false, barcode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
