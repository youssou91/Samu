import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporte les données au format Excel
 * @param {Array} data - Données à exporter
 * @param {string} fileName - Nom du fichier (sans extension)
 * @param {Array} columns - Configuration des colonnes [{key: string, label: string}]
 */
export const exportToExcel = (data, fileName = 'export', columns = []) => {
  try {
    // Si des colonnes sont spécifiées, formater les données en conséquence
    const formattedData = columns.length > 0 
      ? data.map(item => {
          const formattedItem = {};
          columns.forEach(col => {
            formattedItem[col.label] = item[col.key];
          });
          return formattedItem;
        })
      : data;

    const ws = utils.json_to_sheet(formattedData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Feuille 1');
    writeFile(wb, `${fileName}.xlsx`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    return false;
  }
};

/**
 * Exporte les données au format CSV
 * @param {Array} data - Données à exporter
 * @param {string} fileName - Nom du fichier (sans extension)
 * @param {Array} columns - Configuration des colonnes [{key: string, label: string}]
 */
export const exportToCsv = (data, fileName = 'export', columns = []) => {
  try {
    // Si des colonnes sont spécifiées, formater les données en conséquence
    const formattedData = columns.length > 0 
      ? data.map(item => {
          const formattedItem = {};
          columns.forEach(col => {
            formattedItem[col.label] = item[col.key];
          });
          return formattedItem;
        })
      : data;

    const ws = utils.json_to_sheet(formattedData);
    const csv = utils.sheet_to_csv(ws);
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    return false;
  }
};

/**
 * Exporte les données au format PDF
 * @param {Array} data - Données à exporter
 * @param {string} title - Titre du document
 * @param {string} fileName - Nom du fichier (sans extension)
 * @param {Array} columns - Configuration des colonnes [{key: string, header: string}]
 * @param {Object} options - Options supplémentaires pour le PDF
 */
export const exportToPdf = (
  data, 
  title = 'Export', 
  fileName = 'export',
  columns = [],
  options = {}
) => {
  try {
    const { orientation = 'portrait', unit = 'mm', format = 'a4' } = options;
    
    // Créer un nouveau document PDF
    const doc = new jsPDF({
      orientation,
      unit,
      format
    });
    
    // Ajouter le titre
    const titleFontSize = 16;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, margin, { align: 'center' });
    
    // Préparer les données pour le tableau
    const tableColumn = columns.length > 0 
      ? columns.map(col => col.header)
      : (data.length > 0 ? Object.keys(data[0]) : []);
    
    const tableRows = [];
    
    data.forEach(item => {
      const rowData = [];
      if (columns.length > 0) {
        columns.forEach(col => {
          rowData.push(item[col.key]?.toString() || '');
        });
      } else {
        Object.values(item).forEach(value => {
          rowData.push(value?.toString() || '');
        });
      }
      tableRows.push(rowData);
    });
    
    // Ajouter le tableau
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: margin + 10,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: margin + 10 }
    });
    
    // Ajouter la date et l'heure d'exportation
    const date = new Date().toLocaleString();
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150);
      
      // Numéro de page
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.getWidth() - margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
      
      // Date d'exportation
      doc.text(
        `Exporté le: ${date}`,
        margin,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'left' }
      );
    }
    
    // Enregistrer le PDF
    doc.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    return false;
  }
};

/**
 * Exporte les données dans le format spécifié
 * @param {string} format - Format d'export ('excel', 'csv', 'pdf')
 * @param {Array} data - Données à exporter
 * @param {string} fileName - Nom du fichier (sans extension)
 * @param {string} title - Titre du document (pour PDF)
 * @param {Array} columns - Configuration des colonnes
 * @param {Object} options - Options supplémentaires
 */
export const exportData = (
  format,
  data,
  fileName = 'export',
  title = 'Export',
  columns = [],
  options = {}
) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('Aucune donnée à exporter');
    return false;
  }
  
  switch (format.toLowerCase()) {
    case 'excel':
      return exportToExcel(data, fileName, columns);
    case 'csv':
      return exportToCsv(data, fileName, columns);
    case 'pdf':
      return exportToPdf(data, title, fileName, columns, options);
    default:
      console.error(`Format d'export non pris en charge: ${format}`);
      return false;
  }
};

export default {
  toExcel: exportToExcel,
  toCsv: exportToCsv,
  toPdf: exportToPdf,
  export: exportData
};
