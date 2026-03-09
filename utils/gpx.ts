import { Geocache } from '../types';

// Mapping text types to IDs used in the app (based on constants)
const TYPE_MAP: Record<string, number> = {
  'Traditional Cache': 2,
  'Multi-cache': 3,
  'Unknown Cache': 8, // Mystery
  'Virtual Cache': 4,
  'Letterbox Hybrid': 5,
  'Event Cache': 6,
  'Webcam Cache': 11,
  'Cache In Trash Out Event': 13,
  'Earthcache': 137
};

// Reverse mapping for Export (ID -> Standard GPX English Name)
const ID_TO_TYPE_MAP: Record<number, string> = {
  2: 'Traditional Cache',
  3: 'Multi-cache',
  8: 'Unknown Cache',
  4: 'Virtual Cache',
  5: 'Letterbox Hybrid',
  6: 'Event Cache',
  11: 'Webcam Cache',
  13: 'Cache In Trash Out Event',
  137: 'Earthcache'
};

const CONTAINER_MAP: Record<string, number> = {
  'Micro': 2,
  'Regular': 3,
  'Large': 4,
  'Virtual': 5,
  'Other': 6,
  'Small': 8,
  'Not chosen': 1
};

// Reverse mapping for Export
const ID_TO_CONTAINER_MAP: Record<number, string> = {
  2: 'Micro',
  3: 'Regular',
  4: 'Large',
  5: 'Virtual',
  6: 'Other',
  8: 'Small',
  1: 'Not chosen'
};

export function parseGpx(xmlString: string): Geocache[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const wpts = xmlDoc.getElementsByTagName("wpt");
  const parsedCaches: Geocache[] = [];

  for (let i = 0; i < wpts.length; i++) {
    const wpt = wpts[i];
    
    try {
      const lat = parseFloat(wpt.getAttribute("lat") || "0");
      const lon = parseFloat(wpt.getAttribute("lon") || "0");
      
      const code = getTagValue(wpt, "name") || `GPX-${i}`;
      // In Groundspeak GPX, name is usually the GC code, and "urlname" or desc is the title
      // We look for Groundspeak extensions primarily
      
      let name = getTagValue(wpt, "urlname") || getTagValue(wpt, "desc") || code;
      let typeStr = getTagValue(wpt, "type") || "Traditional Cache";
      // Clean up type string (often "Geocache|Traditional Cache")
      if (typeStr.includes('|')) typeStr = typeStr.split('|')[1].trim();

      const gs = wpt.getElementsByTagName("groundspeak:cache")[0];
      
      let difficulty = 1.5;
      let terrain = 1.5;
      let containerStr = "Other";
      let owner = "Unknown";
      let placed = "";
      let fav = 0;

      if (gs) {
        name = getTagValue(gs, "groundspeak:name") || name;
        owner = getTagValue(gs, "groundspeak:owner") || owner;
        difficulty = parseFloat(getTagValue(gs, "groundspeak:difficulty") || "1.5");
        terrain = parseFloat(getTagValue(gs, "groundspeak:terrain") || "1.5");
        containerStr = getTagValue(gs, "groundspeak:container") || containerStr;
        // Basic date format fix
        // fav points are not standard in all GPX, but sometimes in extensions
      }

      parsedCaches.push({
        code: code,
        name: name,
        geocacheType: TYPE_MAP[typeStr] || 2, // Default to Traditional
        containerType: CONTAINER_MAP[containerStr] || 6, // Default to Other
        difficulty: difficulty,
        terrain: terrain,
        latitude: lat,
        longitude: lon,
        placedDate: placed,
        lastFoundDate: "", // Usually requires logs parsing
        ownerUsername: owner,
        favoritePoints: fav
      });
    } catch (e) {
      console.warn("Failed to parse waypoint", e);
    }
  }

  return parsedCaches;
}

function getTagValue(parent: Element, tagName: string): string | null {
  const els = parent.getElementsByTagName(tagName);
  return els.length > 0 ? els[0].textContent : null;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

export function generateGpx(caches: Geocache[]): string {
  const time = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<gpx version="1.0" creator="GeoMapCN" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/0" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd http://www.groundspeak.com/cache/1/0/1 http://www.groundspeak.com/cache/1/0/1/cache.xsd" xmlns:groundspeak="http://www.groundspeak.com/cache/1/0/1">
  <name>GeoMapCN Export</name>
  <desc>Exported Caches</desc>
  <time>${time}</time>`;

  caches.forEach(cache => {
    const typeName = ID_TO_TYPE_MAP[cache.geocacheType] || 'Unknown Cache';
    const containerName = ID_TO_CONTAINER_MAP[cache.containerType] || 'Other';
    const sym = 'Geocache';
    const cleanName = escapeXml(cache.name);
    const cleanOwner = escapeXml(cache.ownerUsername);

    xml += `
  <wpt lat="${cache.latitude}" lon="${cache.longitude}">
    <time>${time}</time>
    <name>${cache.code}</name>
    <desc>${cleanName}</desc>
    <url>https://www.geocaching.com/geocache/${cache.code}</url>
    <urlname>${cleanName}</urlname>
    <sym>${sym}</sym>
    <type>Geocache|${typeName}</type>
    <groundspeak:cache id="${Math.floor(Math.random() * 10000000)}" available="True" archived="False" xmlns:groundspeak="http://www.groundspeak.com/cache/1/0/1">
      <groundspeak:name>${cleanName}</groundspeak:name>
      <groundspeak:placed_by>${cleanOwner}</groundspeak:placed_by>
      <groundspeak:owner id="0">${cleanOwner}</groundspeak:owner>
      <groundspeak:type>${typeName}</groundspeak:type>
      <groundspeak:container>${containerName}</groundspeak:container>
      <groundspeak:difficulty>${cache.difficulty}</groundspeak:difficulty>
      <groundspeak:terrain>${cache.terrain}</groundspeak:terrain>
      <groundspeak:country>China</groundspeak:country>
      <groundspeak:state></groundspeak:state>
    </groundspeak:cache>
  </wpt>`;
  });

  xml += `
</gpx>`;

  return xml;
}