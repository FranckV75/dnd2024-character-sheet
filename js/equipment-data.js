// =============================================================================
// EQUIPMENT-DATA.JS - Base de données des Armures D&D 2024
// =============================================================================

const EQUIPMENT_DATA = {
    armors: [
        // Armures Légères
        { name: "Armure matelassée", type: "Légère", ca: "11 + Dex", str: "-", stealth: true, weight: "4 kg", price: "5 po" },
        { name: "Armure de cuir", type: "Légère", ca: "11 + Dex", str: "-", stealth: false, weight: "5 kg", price: "10 po" },
        { name: "Cuir clouté", type: "Légère", ca: "12 + Dex", str: "-", stealth: false, weight: "6 kg", price: "45 po" },

        // Armures Intermédiaires
        { name: "Armure de peaux", type: "Interméd.", ca: "12 + Dex (max 2)", str: "-", stealth: false, weight: "6 kg", price: "10 po" },
        { name: "Chemise de mailles", type: "Interméd.", ca: "13 + Dex (max 2)", str: "-", stealth: false, weight: "10 kg", price: "50 po" },
        { name: "Armure d'écailles", type: "Interméd.", ca: "14 + Dex (max 2)", str: "-", stealth: true, weight: "20 kg", price: "50 po" },
        { name: "Cuirasse", type: "Interméd.", ca: "14 + Dex (max 2)", str: "-", stealth: false, weight: "10 kg", price: "400 po" },
        { name: "Demi-plate", type: "Interméd.", ca: "15 + Dex (max 2)", str: "-", stealth: true, weight: "20 kg", price: "750 po" },

        // Armures Lourdes
        { name: "Broigne", type: "Lourde", ca: "14", str: "-", stealth: true, weight: "20 kg", price: "30 po" },
        { name: "Cotte de mailles", type: "Lourde", ca: "16", str: "13", stealth: true, weight: "25 kg", price: "75 po" },
        { name: "Clibanion", type: "Lourde", ca: "17", str: "15", stealth: true, weight: "27 kg", price: "200 po" },
        { name: "Harnois", type: "Lourde", ca: "18", str: "15", stealth: true, weight: "29 kg", price: "1500 po" },

        // Bouclier
        { name: "Bouclier", type: "Bouclier", ca: "+2", str: "-", stealth: false, weight: "3 kg", price: "10 po" }
    ]
};
