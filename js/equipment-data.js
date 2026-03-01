// =============================================================================
// EQUIPMENT-DATA.JS - Base de données des Armures D&D 2024
// =============================================================================

const EQUIPMENT_DATA = {
    armors: [
        // Armures Légères
        { name: "Armure matelassée", type: "Légère", ca: "11 + Dex", str: "-", stealth: true, weight: "8 lb", price: "5 po" },
        { name: "Armure de cuir", type: "Légère", ca: "11 + Dex", str: "-", stealth: false, weight: "10 lb", price: "10 po" },
        { name: "Cuir clouté", type: "Légère", ca: "12 + Dex", str: "-", stealth: false, weight: "13 lb", price: "45 po" },

        // Armures Intermédiaires
        { name: "Armure de peaux", type: "Interméd.", ca: "12 + Dex (max 2)", str: "-", stealth: false, weight: "12 lb", price: "10 po" },
        { name: "Chemise de mailles", type: "Interméd.", ca: "13 + Dex (max 2)", str: "-", stealth: false, weight: "20 lb", price: "50 po" },
        { name: "Armure d'écailles", type: "Interméd.", ca: "14 + Dex (max 2)", str: "-", stealth: true, weight: "45 lb", price: "50 po" },
        { name: "Cuirasse", type: "Interméd.", ca: "14 + Dex (max 2)", str: "-", stealth: false, weight: "20 lb", price: "400 po" },
        { name: "Demi-plate", type: "Interméd.", ca: "15 + Dex (max 2)", str: "-", stealth: true, weight: "40 lb", price: "750 po" },

        // Armures Lourdes
        { name: "Broigne", type: "Lourde", ca: "14", str: "-", stealth: true, weight: "40 lb", price: "30 po" },
        { name: "Cotte de mailles", type: "Lourde", ca: "16", str: "13", stealth: true, weight: "55 lb", price: "75 po" },
        { name: "Clibanion", type: "Lourde", ca: "17", str: "15", stealth: true, weight: "60 lb", price: "200 po" },
        { name: "Harnois", type: "Lourde", ca: "18", str: "15", stealth: true, weight: "65 lb", price: "1500 po" },

        // Bouclier
        { name: "Bouclier", type: "Bouclier", ca: "+2", str: "-", stealth: false, weight: "6 lb", price: "10 po" }
    ]
};
