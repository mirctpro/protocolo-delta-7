/* =========================================
   DATOS & CONFIGURACIÓN
   ========================================= */
const resourcesData = [
    { title: "Material de Estudio 1", type: "pdf", url: "recursos/material1.pdf", desc: "Guía básica." },
    { title: "Material de Estudio 2", type: "pdf", url: "recursos/material2.pdf", desc: "Clasificación." },
    { title: "Material de Estudio 3", type: "pdf", url: "recursos/material3.pdf", desc: "Impacto ambiental." },
    { title: "Video Educativo 1", type: "video", url: "uaI3PLmAJyM", desc: "Aprende a reciclar." },
    { title: "Video Educativo 2", type: "video", url: "YiHTNfKJwAw", desc: "Ciclo del reciclaje." },
    { title: "Video Educativo 3", type: "video", url: "Nfh1ECuRTcE", desc: "Contenedores." }
];

const hints = {
    "Organico": "✅ Cáscaras, restos de comida (Marrón)",
    "Reciclable": "✅ Plástico y Latas limpias (Amarillo)",
    "Papel": "✅ Cartón y Papel limpio (Azul)",
    "Vidrio": "✅ Botellas y Frascos sin tapa (Verde)",
    "No Aprovechable": "✅ Servilletas, envolturas sucias (Negro/Gris)"
};

// Preguntas del Juego
const gameItems = [
    { name: "Botella Plástica", type: "yellow", icon: "🥤", reason: "Plástico va en amarillo." },
    { name: "Lata de Refresco", type: "yellow", icon: "🥫", reason: "Latas de aluminio van en amarillo." },
    { name: "Caja de Cartón", type: "blue", icon: "📦", reason: "Cartón limpio va en azul." },
    { name: "Hoja de Papel", type: "blue", icon: "📄", reason: "Papel de oficina va en azul." },
    { name: "Cáscara de Banano", type: "brown", icon: "🍌", reason: "Orgánico compostable va en marrón." },
    { name: "Restos de Manzana", type: "brown", icon: "🍎", reason: "Comida cruda es orgánica (marrón)." },
    { name: "Botella de Vino", type: "green", icon: "🍾", reason: "Vidrio se recicla en verde." },
    { name: "Frasco de Vidrio", type: "green", icon: "🏺", reason: "Envases de vidrio van en verde." },
    { name: "Servilleta Sucia", type: "brown", icon: "🧻", reason: "Papel sucio con comida va a orgánico o basura." }
];

/* =========================================
   ESTADO GLOBAL
   ========================================= */
let appState = { 
    registros: [], 
    mural: [], 
    gameScores: [], 
    manualFinish: false, 
    currentUser: "" 
};
let editingDataId = null;
let currentTrashItem = null, good = 0, bad = 0, qCount = 0;
const MAX_QUESTIONS = 15;

// Charts
Chart.register(ChartDataLabels);
let chartType, chartContext, chartTimeline;

/* =========================================
   INICIALIZACIÓN & OFFLINE
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    if(!appState.currentUser) document.getElementById('welcome-modal').style.display = 'flex';
    else {
        document.getElementById('user-display').innerText = `Usuario: ${appState.currentUser}`;
        document.getElementById('cert-name').value = appState.currentUser;
    }
    
    renderTable();
    renderMural();
    renderRanking();
    renderResources();
    initCharts();
    updateCharts();
    updateProgress();
    setTodayDate();
    
    // Default tab
    if(!document.querySelector('.tab-content.active')) switchTab('registro');
    
    // Logo error handler
    const imgLogo = document.getElementById('project-logo');
    if(imgLogo) imgLogo.onerror = function() { console.log("Logo missing"); };

    // Offline Detect
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
});

function updateOnlineStatus() {
    const banner = document.getElementById('offline-indicator');
    if(navigator.onLine) banner.style.display = 'none';
    else banner.style.display = 'flex';
}

function setGlobalUser() {
    const name = document.getElementById('global-username').value.trim();
    if(name) {
        appState.currentUser = name;
        saveData();
        document.getElementById('welcome-modal').style.display = 'none';
        document.getElementById('user-display').innerText = `Usuario: ${name}`;
        document.getElementById('cert-name').value = name;
        showToast(`¡Hola, ${name}!`);
    } else showToast("Escribe un nombre", "error");
}

function saveData() {
    localStorage.setItem('ecoLabV7', JSON.stringify(appState));
    updateProgress();
    updateCharts();
}

function loadData() {
    const d = localStorage.getItem('ecoLabV7');
    if (d) {
        const p = JSON.parse(d);
        appState.registros = p.registros || [];
        appState.mural = p.mural || [];
        appState.gameScores = p.gameScores || [];
        appState.manualFinish = p.manualFinish || false;
        appState.currentUser = p.currentUser || "";
    }
}

/* =========================================
   MURAL (POST-ITS)
   ========================================= */
document.getElementById('mural-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('mural-title').value;
    const content = document.getElementById('mural-content').value;
    const color = document.getElementById('mural-color').value;
    
    appState.mural.push({
        id: Date.now(),
        author: appState.currentUser,
        title, content, color,
        date: new Date().toLocaleDateString()
    });
    
    saveData();
    renderMural();
    document.getElementById('mural-title').value = '';
    document.getElementById('mural-content').value = '';
    showToast("Nota pegada en el mural");
});

function renderMural() {
    const board = document.getElementById('mural-board');
    board.innerHTML = '';
    appState.mural.forEach(note => {
        const div = document.createElement('div');
        div.className = `post-it ${note.color}`;
        div.innerHTML = `
            <button class="btn-delete-note" onclick="deleteNote(${note.id})"><i class="ph ph-x"></i></button>
            <h4>${note.title}</h4>
            <p>${note.content}</p>
            <div class="post-it-meta">${note.author} - ${note.date}</div>
        `;
        board.appendChild(div);
    });
}

function deleteNote(id) {
    // CAMBIO: Usar Modal personalizado en vez de confirm()
    showModal("¿Deseas quitar esta nota del mural?", () => {
        appState.mural = appState.mural.filter(n => n.id !== id);
        saveData();
        renderMural();
        showToast("Nota eliminada");
    });
}

/* =========================================
   JUEGO (CONFETI & RANKING)
   ========================================= */
function startGame() {
    document.getElementById('game-intro').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    resetGame();
}
function resetGame() {
    good = 0; bad = 0; qCount = 0;
    updateGameUI();
    nextTrashItem();
}
function nextTrashItem() {
    if (qCount >= MAX_QUESTIONS) { endGame(true); return; }
    qCount++;
    document.getElementById('q-current').innerText = qCount;
    currentTrashItem = gameItems[Math.floor(Math.random() * gameItems.length)];
    document.getElementById('trash-icon').innerText = currentTrashItem.icon;
    document.getElementById('trash-name').innerText = currentTrashItem.name;
}
function checkAnswer(color) {
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('game-feedback-title');
    const msg = document.getElementById('game-feedback-msg');
    const icon = document.getElementById('game-feedback-icon');

    if (color === currentTrashItem.type) {
        good++;
        title.innerText = "¡Correcto!"; title.style.color = "green";
        msg.innerText = currentTrashItem.reason;
        icon.className = "ph ph-check-circle"; icon.style.color = "green";
        confetti({ zIndex: 6000, particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
        bad++;
        title.innerText = "Incorrecto"; title.style.color = "red";
        const colorNames = { yellow: "Amarillo", blue: "Azul", green: "Verde", brown: "Marrón" };
        msg.innerText = `Iba en el contenedor ${colorNames[currentTrashItem.type]}. \n\n${currentTrashItem.reason}`;
        icon.className = "ph ph-x-circle"; icon.style.color = "red";
    }
    updateGameUI();
    modal.style.display = 'flex';
}
function closeGameModal() {
    document.getElementById('game-modal').style.display = 'none';
    nextTrashItem();
}
function endGame(save) {
    if(save) {
        appState.gameScores.push({
            id: Date.now(),
            player: appState.currentUser,
            score: good * 10,
            good, bad,
            date: new Date().toLocaleDateString()
        });
        saveData();
        renderRanking();
        showToast("Juego Finalizado");
    }
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('game-intro').style.display = 'block';
}
function updateGameUI() {
    document.getElementById('score-good').innerText = good;
    document.getElementById('score-bad').innerText = bad;
}
function renderRanking() {
    const tbody = document.querySelector('#ranking-table tbody');
    tbody.innerHTML = '';
    const sorted = [...appState.gameScores].sort((a,b) => b.score - a.score).slice(0, 5);
    sorted.forEach((s, index) => {
        tbody.innerHTML += `<tr><td>${index+1}</td><td>${s.player}</td><td>${s.score} pts</td><td>${s.date}</td></tr>`;
    });
}

/* =========================================
   REGISTROS & TABLA
   ========================================= */
document.getElementById('waste-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
        id: editingDataId || Date.now(),
        estudiante: appState.currentUser,
        fecha: document.getElementById('date').value,
        contexto: document.getElementById('context').value,
        tipo: document.getElementById('type').value,
        unidad: document.getElementById('unit').value,
        cantidad: parseFloat(document.getElementById('quantity').value)
    };
    if(editingDataId) {
        appState.registros = appState.registros.map(r => r.id === editingDataId ? entry : r);
        showToast('Actualizado', 'success'); cancelEditData();
    } else {
        appState.registros.push(entry); 
        showToast('Guardado', 'success'); 
        document.getElementById('quantity').value='';
        // CAMBIO: Ocultar la pista después de guardar para limpiar la vista
        document.getElementById('type-hint-box').style.display = 'none';
        document.getElementById('type').value = ''; // Opcional: limpiar selector
        setTodayDate(); // Asegurar fecha hoy
    }
    saveData(); renderTable();
});

function renderTable() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const tb = document.querySelector('#data-table tbody'); tb.innerHTML = '';
    appState.registros.filter(r => (r.estudiante||"").toLowerCase().includes(term) || r.tipo.toLowerCase().includes(term) || r.fecha.includes(term))
    .sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).forEach(r => {
        tb.innerHTML += `<tr><td>${r.fecha}</td><td>${r.estudiante}</td><td>${r.tipo}</td><td>${r.cantidad} ${r.unidad}</td>
        <td><button class="btn-secondary" style="padding:5px" onclick="editData(${r.id})">✏️</button><button class="btn-danger" style="padding:5px" onclick="delData(${r.id})">🗑️</button></td></tr>`;
    });
}

/* =========================================
   GRÁFICAS & EXPORT
   ========================================= */
function initCharts() {
    const common = { responsive: true, maintainAspectRatio: false };
    chartType = new Chart(document.getElementById('chartType'), { type: 'doughnut', data: {labels:[],datasets:[]}, options: {...common, plugins:{legend:{position:'bottom'},datalabels:{color:'#fff',formatter:(v,c)=>(v*100/c.chart._metasets[c.datasetIndex].total).toFixed(1)+"%"}}} });
    chartTimeline = new Chart(document.getElementById('chartTimeline'), { type: 'line', data: {labels:[],datasets:[]}, options: {...common, scales:{y:{beginAtZero:true}}} });
    chartContext = new Chart(document.getElementById('chartContext'), { type: 'bar', data: {labels:[],datasets:[]}, options: common });
}
function updateCharts() {
    if(!appState.registros.length) return;
    document.getElementById('kpi-total-regs').innerText = appState.registros.length;
    let w = appState.registros.reduce((acc,r) => acc + (r.unidad==='g'?r.cantidad/1000 : (r.unidad==='und'?r.cantidad*0.05 : r.cantidad)), 0);
    document.getElementById('kpi-total-weight').innerText = w.toFixed(2);
    const studs={}; appState.registros.forEach(r=>studs[r.estudiante]=(studs[r.estudiante]||0)+1);
    const top = Object.keys(studs).length ? Object.keys(studs).reduce((a,b)=>studs[a]>studs[b]?a:b) : "-";
    document.getElementById('kpi-top-student').innerText = top;

    const types={}; appState.registros.forEach(r=>{ types[r.tipo]=(types[r.tipo]||0)+r.cantidad });
    chartType.data = { labels: Object.keys(types), datasets:[{ data:Object.values(types), backgroundColor:['#795548','#fbc02d','#1976d2','#388e3c','#212121'] }] }; chartType.update();

    const dates={}; appState.registros.forEach(r=>dates[r.fecha]=(dates[r.fecha]||0)+1);
    const sDates = Object.keys(dates).sort();
    chartTimeline.data = { labels: sDates, datasets:[{ label:'Registros', data:sDates.map(d=>dates[d]), borderColor:'#2e7d32', backgroundColor:'rgba(46,125,50,0.1)', fill:true }] }; chartTimeline.update();

    const ctxs={}; appState.registros.forEach(r=>{ ctxs[r.contexto]=(ctxs[r.contexto]||0)+r.cantidad });
    chartContext.data = { labels: Object.keys(ctxs), datasets:[{ label:'Cant', data:Object.values(ctxs), backgroundColor:'#2e7d32' }] }; chartContext.update();
}

/* =========================================
   UI HELPERS
   ========================================= */
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el=>el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const b = [...document.querySelectorAll('.nav-btn')].find(btn=>btn.getAttribute('onclick').includes(id));
    if(b) b.classList.add('active');
    if(id==='analisis') updateCharts();
}
function renderResources() {
    const g = document.getElementById('resources-grid'); g.innerHTML='';
    resourcesData.forEach(r => {
        g.innerHTML += `<div class="resource-card" onclick="openMedia('${r.url}','${r.type}','${r.title}')">
            <div class="res-icon ${r.type==='video'?'video':'pdf'}"><i class="ph ${r.type==='video'?'ph-youtube-logo':'ph-file-pdf'}"></i></div>
            <div class="res-info"><div class="res-title">${r.title}</div><div class="res-type">${r.desc}</div></div>
        </div>`;
    });
}
function openMedia(url, type, title) {
    if(!navigator.onLine && type==='video') return showToast("Sin conexión: Video no disponible", "error");
    const v = document.getElementById('media-viewer'), b = document.getElementById('media-body');
    document.getElementById('media-title').innerText = title; b.innerHTML='';
    if(type==='video') b.innerHTML=`<iframe src="https://www.youtube.com/embed/${url}" allowfullscreen></iframe>`;
    else { if(window.innerWidth<768) window.open(url,'_blank'); else b.innerHTML=`<iframe src="${url}"></iframe>`; }
    if(window.innerWidth>=768 || type==='video') v.style.display='flex';
}
function closeMedia(){ document.getElementById('media-viewer').style.display='none'; document.getElementById('media-body').innerHTML=''; }
function showTypeHint(){ const v=document.getElementById('type').value; const b=document.getElementById('type-hint-box'); if(hints[v]){b.style.display='block'; document.getElementById('hint-text').innerText=hints[v];} else b.style.display='none'; }
function showToast(m,t='info'){ const c=document.getElementById('toast-container'); c.innerHTML+=`<div class="toast ${t}"><span>${m}</span></div>`; setTimeout(()=>c.innerHTML='', 4000); }
let modalFn=null; function closeModal(){document.getElementById('custom-modal').style.display='none';} 
function showModal(m,f, isDanger=false){
    document.getElementById('modal-message').innerText=m; 
    modalFn=f; 
    const btn = document.getElementById('modal-confirm-btn');
    if(isDanger) { btn.className = 'btn-danger'; btn.innerText = "Borrar Todo"; }
    else { btn.className = 'btn-primary'; btn.innerText = "Confirmar"; }
    document.getElementById('custom-modal').style.display='flex';
}
document.getElementById('modal-confirm-btn').onclick=()=>{if(modalFn)modalFn(); closeModal();};

function editData(id) {
    const r=appState.registros.find(x=>x.id===id); if(!r)return;
    document.getElementById('date').value=r.fecha; document.getElementById('context').value=r.contexto;
    document.getElementById('type').value=r.tipo; document.getElementById('unit').value=r.unidad;
    document.getElementById('quantity').value=r.cantidad; editingDataId=id;
    document.getElementById('cancel-edit-data').style.display='inline-block';
    document.getElementById('submit-data-btn').innerText='Actualizar';
    switchTab('registro');
}
function cancelEditData(){ editingDataId=null; document.getElementById('waste-form').reset(); document.getElementById('cancel-edit-data').style.display='none'; document.getElementById('submit-data-btn').innerText='Guardar'; setTodayDate(); }
function delData(id){ showModal("¿Deseas eliminar este registro permanentemente?", ()=>{appState.registros=appState.registros.filter(x=>x.id!==id); saveData(); renderTable();}); }
function resetForm(id){ document.getElementById(id).reset(); setTodayDate(); document.getElementById('type-hint-box').style.display='none'; }
function setTodayDate(){ 
    const d=document.getElementById('date'); 
    if(d && !d.value) d.value=new Date().toISOString().split('T')[0]; // Solo pone fecha si está vacío o al resetear
}

/* EXPORTS */
function exportDataCSV(){ const c=Papa.unparse(appState.registros); download(c,'Datos.csv'); }
function exportMuralCSV(){ const c=Papa.unparse(appState.mural); download(c,'Mural.csv'); }
function exportGameCSV(){ const c=Papa.unparse(appState.gameScores); download(c,'Juego_Scores.csv'); }
function download(c,n){ const b=new Blob([c],{type:'text/csv'}); const l=document.createElement("a"); l.href=URL.createObjectURL(b); l.download=n; l.click(); }

/* IMPORTS INTELIGENTES */
function handleFileSelect(i){ 
    Papa.parse(i.files[0],{
        header:true, 
        skipEmptyLines:true, 
        complete:(r)=>{
            if(!r.data.length) return showToast("Archivo vacío o ilegible", "error");
            
            // Análisis de estructura para detectar tipo
            const headers = Object.keys(r.data[0]);
            let targetType = "";
            let dataName = "";

            if (headers.includes('estudiante') && headers.includes('tipo')) {
                targetType = 'registros';
                dataName = "Registros de Residuos";
            } else if (headers.includes('title') && headers.includes('content') && headers.includes('color')) {
                targetType = 'mural';
                dataName = "Notas del Mural";
            } else if (headers.includes('player') && headers.includes('score')) {
                targetType = 'gameScores';
                dataName = "Puntuaciones del Juego";
            } else {
                return showToast("Formato CSV desconocido.", "error");
            }

            // Preguntar al usuario antes de importar
            showModal(`Se detectaron ${r.data.length} elementos de ${dataName}. ¿Deseas importarlos? (Se añadirán a lo existente)`, () => {
                // Procesar datos (limpieza básica de IDs para evitar conflictos)
                const newItems = r.data.map(item => ({
                    ...item,
                    id: Date.now() + Math.random(), // Regenerar ID para evitar colisiones
                    cantidad: item.cantidad ? parseFloat(item.cantidad) : undefined,
                    score: item.score ? parseInt(item.score) : undefined
                }));

                appState[targetType] = [...appState[targetType], ...newItems];
                saveData();
                renderTable();
                renderMural();
                renderRanking();
                updateCharts();
                showToast(`¡${dataName} importados con éxito!`, 'success');
            });
        }
    }); 
    // Limpiar input para permitir recargar el mismo archivo
    i.value = '';
}

function updateProgress(){ 
    let p=0; if(appState.registros.length) p+=30; if(appState.mural.length) p+=30; if(appState.gameScores.length) p+=40;
    if(appState.manualFinish) p=100;
    document.getElementById('progress-bar').style.width=p+'%'; document.getElementById('progress-text').innerText=`Progreso: ${p}%`;
    if(p===100) { document.getElementById('btn-cert').disabled=false; document.getElementById('btn-cert').classList.replace('btn-disabled','btn-primary'); }
}
function forceCompleteProject(){ showModal("¿Autorizar finalización manual del proyecto?", ()=>{appState.manualFinish=true; saveData();}); }
function resetProject(){ showModal("¿ESTÁS SEGURO? Se borrarán TODOS los datos locales.", ()=>{localStorage.clear(); location.reload();}, true); }

/* CERTIFICADO PREMIUM */
function generateCertificate(){
    const n = document.getElementById('cert-name').value || "Estudiante";
    const doc = new window.jspdf.jsPDF({orientation:'landscape'});
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    // Marco Decorativo Doble
    doc.setDrawColor(46,125,50); // Verde Principal
    doc.setLineWidth(5);
    doc.rect(10, 10, w-20, h-20); // Borde grueso exterior
    
    doc.setDrawColor(251, 192, 45); // Amarillo secundario
    doc.setLineWidth(1);
    doc.rect(18, 18, w-36, h-36); // Borde fino interior

    // Logo (si existe)
    const l = document.getElementById('project-logo'); 
    if(l.src) try{ doc.addImage(l,'PNG', w/2 - 15, 25, 30, 30); } catch(e){}

    // Títulos y Textos con Tipografías Clásicas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(27,94,32); // Verde Oscuro
    doc.text("CERTIFICADO DE CUMPLIMIENTO", w/2, 80, {align:'center'});

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text("Se otorga el presente Certificado de Cumplimiento a:", w/2, 95, {align:'center'});

    // Nombre del Estudiante (Destacado)
    doc.setFont("times", "italic");
    doc.setFontSize(40);
    doc.setTextColor(0, 0, 0);
    doc.text(n, w/2, 115, {align:'center'});

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(100);
    doc.line(w/2 - 80, 120, w/2 + 80, 120);

    // Descripción del Logro
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(46, 125, 50);
    doc.text("Por haber completado el Proyecto de Investigación STEM,", w/2, 135, {align:'center'});
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(80);
    doc.text("con enfoque en Clasificación de Residuos, Análisis de Datos y Conciencia Ambiental.", w/2, 145, {align:'center'});

    // Fecha Actual Automática en Español
    const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Expedido el: ${fecha}`, w/2, 175, {align:'center'});

    doc.save(`Certificado_${n.replace(/\s+/g,'_')}.pdf`);
}