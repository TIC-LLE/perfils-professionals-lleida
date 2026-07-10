
const RUTA_JSON = "data/perfils.json";

let dadesGlobals = null;

const elCerca = document.getElementById("cercaInput");
const elFamilia = document.getElementById("filtreFamilia");
const elNivell = document.getElementById("filtreNivell");
const elNeteja = document.getElementById("netejaFiltres");
const elLlista = document.getElementById("llistaCicles");
const elCapResultat = document.getElementById("capResultat");
const elComptador = document.getElementById("comptadorResultats");
const elPeuInfo = document.getElementById("peuInfo");
const elSubtitol = document.getElementById("subtitol-pagina");
const elTitol = document.getElementById("titol-pagina");

fetch(RUTA_JSON)
  .then(function (resposta) {
    if (!resposta.ok) {
      throw new Error("No s'ha pogut carregar " + RUTA_JSON);
    }
    return resposta.json();
  })
  .then(function (dades) {
    dadesGlobals = dades;
    inicialitza(dades);
  })
  .catch(function (error) {
    elLlista.innerHTML =
      '<p class="cap-resultat">No s\'han pogut carregar les dades (' +
      escapaHtml(error.message) +
      ").</p>";
  });

function inicialitza(dades) {
  if (dades.meta) {
    if (dades.meta.titol) {
      elTitol.textContent = dades.meta.titol;
    }
    const parts = [];
    if (dades.meta.organisme) parts.push(dades.meta.organisme);
    if (dades.meta.departament) parts.push(dades.meta.departament);
    elSubtitol.textContent = parts.join(" · ");

    const peuParts = [];
    if (dades.meta.actualitzat) peuParts.push(dades.meta.actualitzat);
    if (dades.meta.contacte) peuParts.push("Contacte: " + dades.meta.contacte);
    elPeuInfo.textContent = peuParts.join(" · ");
  }

  omplirSelect(elFamilia, dades.families || []);
  omplirSelect(elNivell, dades.nivells || []);

  renderitza(dades.cicles || []);

  elCerca.addEventListener("input", aplicaFiltres);
  elFamilia.addEventListener("change", aplicaFiltres);
  elNivell.addEventListener("change", aplicaFiltres);
  elNeteja.addEventListener("click", function () {
    elCerca.value = "";
    elFamilia.value = "";
    elNivell.value = "";
    aplicaFiltres();
  });
}

function omplirSelect(select, valors) {
  valors.forEach(function (valor) {
    const opcio = document.createElement("option");
    opcio.value = valor;
    opcio.textContent = valor;
    select.appendChild(opcio);
  });
}

function normalitza(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function aplicaFiltres() {
  if (!dadesGlobals) return;

  const termeCerca = normalitza(elCerca.value.trim());
  const familiaSel = elFamilia.value;
  const nivellSel = elNivell.value;

  const filtrats = (dadesGlobals.cicles || []).filter(function (cicle) {
    const coincideixFamilia = !familiaSel || cicle.familia === familiaSel;
    const coincideixNivell = !nivellSel || cicle.nivell === nivellSel;
    const coincideixCerca =
      !termeCerca || normalitza(cicle.cerca || "").includes(termeCerca);

    return coincideixFamilia && coincideixNivell && coincideixCerca;
  });

  renderitza(filtrats, termeCerca);
}

function renderitza(cicles, termeCerca) {
  elLlista.innerHTML = "";

  elComptador.textContent =
    cicles.length + (cicles.length === 1 ? " cicle trobat" : " cicles trobats");

  if (cicles.length === 0) {
    elCapResultat.hidden = false;
    return;
  }

  elCapResultat.hidden = true;

  const fragment = document.createDocumentFragment();

  cicles.forEach(function (cicle) {
    fragment.appendChild(creaTargeta(cicle, termeCerca));
  });

  elLlista.appendChild(fragment);
}

function creaTargeta(cicle, termeCerca) {
  const targeta = document.createElement("article");
  targeta.className = "targeta-cicle";

  const capcalera = document.createElement("div");
  capcalera.className = "targeta-capcalera";

  const nom = document.createElement("h2");
  nom.className = "targeta-nom";
  nom.innerHTML = ressalta(cicle.nom, termeCerca);

  const nivell = document.createElement("span");
  nivell.className = "etiqueta-nivell";
  nivell.textContent = cicle.nivell || "";

  capcalera.appendChild(nom);
  capcalera.appendChild(nivell);

  const familia = document.createElement("p");
  familia.className = "targeta-familia";
  familia.textContent = cicle.familia || "";

  const meta = document.createElement("p");
  meta.className = "targeta-meta";
  meta.textContent = "Codi: " + (cicle.codi || "");

  targeta.appendChild(capcalera);
  targeta.appendChild(familia);
  targeta.appendChild(meta);

  if (cicle.perfils && cicle.perfils.length > 0) {
    const titolPerfils = document.createElement("p");
    titolPerfils.className = "targeta-seccio-titol";
    titolPerfils.textContent = "Perfils professionals";

    const llista = document.createElement("ul");
    llista.className = "llista-perfils";

    cicle.perfils.forEach(function (perfil) {
      const li = document.createElement("li");
      li.innerHTML = ressalta(perfil, termeCerca);
      llista.appendChild(li);
    });

    targeta.appendChild(titolPerfils);
    targeta.appendChild(llista);
  }

  if (cicle.centresText) {
    const titolCentres = document.createElement("p");
    titolCentres.className = "targeta-seccio-titol";
    titolCentres.textContent = "Centres";

    const centres = document.createElement("p");
    centres.className = "targeta-centres";
    centres.innerHTML = ressalta(cicle.centresText, termeCerca);

    targeta.appendChild(titolCentres);
    targeta.appendChild(centres);
  }

  const peu = document.createElement("div");
  peu.className = "targeta-peu";

  if (cicle.plaActivitats && cicle.plaActivitats.url) {
    const enllac = document.createElement("a");
    enllac.className = "enllac-pla";
    enllac.href = cicle.plaActivitats.url;
    enllac.target = "_blank";
    enllac.rel = "noopener noreferrer";
    enllac.textContent = cicle.plaActivitats.text || "Pla d'activitats";
    peu.appendChild(enllac);
  } else {
    const sensePla = document.createElement("span");
    sensePla.className = "pla-sense-enllac";
    sensePla.textContent =
      (cicle.plaActivitats && cicle.plaActivitats.text) ||
      "Pla d'activitats (sense enllaç)";
    peu.appendChild(sensePla);
  }

  targeta.appendChild(peu);

  return targeta;
}

function ressalta(text, terme) {
  const segur = escapaHtml(text || "");

  if (!terme) {
    return segur;
  }

  const textNormalitzat = normalitza(text || "");
  const index = textNormalitzat.indexOf(terme);

  if (index === -1) {
    return segur;
  }

  const abans = escapaHtml((text || "").slice(0, index));
  const coincidencia = escapaHtml((text || "").slice(index, index + terme.length));
  const despres = escapaHtml((text || "").slice(index + terme.length));

  return abans + "<mark>" + coincidencia + "</mark>" + despres;
}

function escapaHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
