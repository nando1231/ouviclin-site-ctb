// Configuração do Supabase para o site Ouviclin
const SUPABASE_URL = 'https://pvlkipwpdosvbyjhyysn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bGtpcHdwZG9zdmJ5amh5eXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MjQxMTEsImV4cCI6MjA4NTEwMDExMX0.g0L6XvzJESiaEoia9K9e_ARBUzsABbUlljnv-tyg_l4';

let supabaseClient = null;

function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase inicializado com sucesso.');
            setupFormInterception();
        } else {
            console.error('Erro: Biblioteca Supabase não encontrada.');
        }
    } catch (e) {
        console.error('Erro ao inicializar Supabase:', e);
    }
}

async function sendToSupabase(data) {
    try {
        const { error } = await supabaseClient
            .from('leads')
            .insert([data]);
        if (error) throw error;
        console.log('Dados enviados para o Supabase com sucesso.');
        return true;
    } catch (error) {
        console.error('Erro ao enviar para o Supabase:', error);
        return false;
    }
}

function setupFormInterception() {
    // 1. Interceptar formulários padrão
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            // Não damos preventDefault aqui para permitir que o fluxo original (como abrir WhatsApp) continue
            // mas capturamos os dados antes
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            data['created_at'] = new Date().toISOString();
            data['source'] = 'form_submit';
            
            await sendToSupabase(data);
        });
    });

    // 2. Interceptar cliques em botões que parecem de agendamento (como o do WhatsApp)
    document.addEventListener('click', async function(e) {
        const target = e.target.closest('a, button, .e_botao');
        if (!target) return;

        const text = target.innerText || '';
        if (text.includes('Agendar') || text.includes('Avaliação') || target.href?.includes('wa.me')) {
            // Tentar encontrar inputs próximos (no mesmo container ou seção)
            const section = target.closest('section, div.c');
            if (section) {
                const inputs = section.querySelectorAll('input');
                if (inputs.length > 0) {
                    const data = {};
                    inputs.forEach(input => {
                        if (input.name) data[input.name] = input.value;
                        else if (input.placeholder) data[input.placeholder] = input.value;
                    });
                    
                    if (Object.keys(data).length > 0) {
                        data['created_at'] = new Date().toISOString();
                        data['source'] = 'button_click';
                        data['button_text'] = text.trim();
                        
                        await sendToSupabase(data);
                    }
                }
            }
        }
    }, true);
}
