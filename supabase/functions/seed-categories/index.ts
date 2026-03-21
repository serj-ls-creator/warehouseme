import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const defaultCategories = [
  { name: "Техника и электроника", icon: "💻", children: [
    { name: "Смартфоны и планшеты", icon: "📱" },
    { name: "Ноутбуки и компьютеры", icon: "💻" },
    { name: "Телевизоры и мониторы", icon: "📺" },
    { name: "Аудиотехника", icon: "🎧" },
    { name: "Бытовая техника", icon: "🏠" },
    { name: "Фото и видеокамеры", icon: "📷" },
    { name: "Умный дом", icon: "🏡" },
    { name: "Игровые консоли", icon: "🎮" },
    { name: "Аксессуары и кабели", icon: "🔌" },
  ]},
  { name: "Инструменты", icon: "🔧", children: [
    { name: "Ручной инструмент", icon: "🔨" },
    { name: "Электроинструмент", icon: "⚡" },
    { name: "Садовый инструмент", icon: "🌿" },
    { name: "Измерительные приборы", icon: "📏" },
    { name: "Расходники", icon: "🔩" },
  ]},
  { name: "Мебель", icon: "🏠", children: [
    { name: "Диваны и кресла", icon: "🛋️" },
    { name: "Кровати и матрасы", icon: "🛏️" },
    { name: "Столы и стулья", icon: "🪑" },
    { name: "Шкафы и стеллажи", icon: "🗄️" },
    { name: "Детская мебель", icon: "🧒" },
    { name: "Садовая мебель", icon: "🌳" },
  ]},
  { name: "Кухня", icon: "🍳", children: [
    { name: "Посуда и сервизы", icon: "🍽️" },
    { name: "Кастрюли и сковороды", icon: "🥘" },
    { name: "Столовые приборы", icon: "🍴" },
    { name: "Контейнеры и хранение", icon: "📦" },
  ]},
  { name: "Одежда и обувь", icon: "👕", children: [
    { name: "Верхняя одежда", icon: "🧥" },
    { name: "Повседневная одежда", icon: "👔" },
    { name: "Спортивная одежда", icon: "🏃" },
    { name: "Обувь", icon: "👟" },
    { name: "Аксессуары", icon: "👜" },
    { name: "Детская одежда", icon: "👶" },
  ]},
  { name: "Детские товары", icon: "🧸", children: [
    { name: "Игрушки", icon: "🪀" },
    { name: "Развивающие игры и пазлы", icon: "🧩" },
    { name: "Коляски и автокресла", icon: "🚼" },
    { name: "Одежда по размерам", icon: "👶" },
    { name: "Школьные принадлежности", icon: "✏️" },
    { name: "Спортивный инвентарь для детей", icon: "⚽" },
  ]},
  { name: "Здоровье и медицина", icon: "💊", children: [
    { name: "Лекарства", icon: "💊" },
    { name: "Медицинские приборы", icon: "🩺" },
    { name: "Витамины и добавки", icon: "🧬" },
    { name: "Первая помощь", icon: "🩹" },
    { name: "Оптика", icon: "👓" },
  ]},
  { name: "Спорт и активный отдых", icon: "🏋️", children: [
    { name: "Тренажёры и оборудование", icon: "🏋️" },
    { name: "Летний спорт", icon: "🚴" },
    { name: "Зимний спорт", icon: "⛷️" },
    { name: "Водный спорт", icon: "🏊" },
    { name: "Туристическое снаряжение", icon: "🏕️" },
  ]},
  { name: "Книги и настолки", icon: "📚", children: [
    { name: "Художественная литература", icon: "📖" },
    { name: "Нон-фикшн и учебники", icon: "📘" },
    { name: "Детские книги", icon: "📕" },
    { name: "Бизнес литература", icon: "📗" },
    { name: "Настольные игры и карты", icon: "🎲" },
  ]},
  { name: "Хобби и творчество", icon: "🎨", children: [
    { name: "Рисование и живопись", icon: "🖌️" },
    { name: "Музыкальные инструменты", icon: "🎸" },
    { name: "Рукоделие (шитьё, вязание)", icon: "🧵" },
    { name: "Моделирование и коллекционирование", icon: "🏗️" },
    { name: "Фотография", icon: "📸" },
    { name: "3D-печать", icon: "🖨️" },
  ]},
  { name: "Бытовая химия и уход", icon: "🧴", children: [
    { name: "Чистящие средства", icon: "🧹" },
    { name: "Уход за одеждой", icon: "👗" },
    { name: "Личная гигиена", icon: "🧼" },
    { name: "Уход за кожей и волосами", icon: "💇" },
  ]},
  { name: "Сад и огород", icon: "🌱", children: [
    { name: "Семена и луковицы", icon: "🌾" },
    { name: "Удобрения и грунт", icon: "🪴" },
    { name: "Горшки и кашпо", icon: "🏺" },
    { name: "Садовый инвентарь", icon: "🌿" },
    { name: "Поливочное оборудование", icon: "💧" },
    { name: "Комнатные растения", icon: "🪻" },
  ]},
  { name: "Документы и ценности", icon: "📄", children: [
    { name: "Паспорта и удостоверения", icon: "🪪" },
    { name: "Страховые полисы", icon: "📋" },
    { name: "Гарантийные талоны", icon: "🛡️" },
    { name: "Чеки и квитанции", icon: "🧾" },
    { name: "Ценные бумаги", icon: "💰" },
    { name: "Ключи", icon: "🔑" },
  ]},
  { name: "Строительство и ремонт", icon: "🏗️", children: [
    { name: "Отделочные материалы", icon: "🧱" },
    { name: "Краски и лаки", icon: "🎨" },
    { name: "Крепёж и фурнитура", icon: "🔩" },
    { name: "Сантехника", icon: "🚰" },
    { name: "Электрика (провода, розетки)", icon: "⚡" },
    { name: "Утеплители и герметики", icon: "🧊" },
  ]},
  { name: "Хранение и упаковка", icon: "📦", children: [
    { name: "Коробки и контейнеры", icon: "📦" },
    { name: "Пакеты для вещей", icon: "🛍️" },
  ]},
  { name: "Подарки и праздники", icon: "🎁", children: [
    { name: "Упаковочные материалы", icon: "🎀" },
    { name: "Украшения (Рождество, ДР)", icon: "🎄" },
    { name: "Заготовленные подарки", icon: "🎁" },
    { name: "Свечи и декор", icon: "🕯️" },
  ]},
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has categories
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: 'Categories already exist', seeded: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Seed categories
    for (const cat of defaultCategories) {
      const { data: parent, error: parentError } = await supabase
        .from('categories')
        .insert({ user_id: user.id, name: cat.name, icon: cat.icon, color: '#1E2A4A', parent_id: null })
        .select('id')
        .single();

      if (parentError) {
        console.error('Error inserting parent:', parentError);
        continue;
      }

      if (cat.children && cat.children.length > 0) {
        const childRows = cat.children.map(c => ({
          user_id: user.id,
          name: c.name,
          icon: c.icon,
          color: '#1E2A4A',
          parent_id: parent.id,
        }));
        const { error: childError } = await supabase.from('categories').insert(childRows);
        if (childError) console.error('Error inserting children:', childError);
      }
    }

    return new Response(JSON.stringify({ message: 'Categories seeded', seeded: true }), {
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
