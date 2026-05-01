import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditDetails } from '../../../models/audit.model';

@Component({
  selector: 'app-audit-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-report.component.html',
  styleUrl: './audit-report.component.css',
})
export class AuditReportComponent {
  @Input() audit: AuditDetails | null = null;
  @Output() close = new EventEmitter<void>();

  currentPage: number = 1;

  get questionsPerPage() {
    return 6; // Show 6 questions per page
  }

  get totalPages() {
    if (!this.audit?.questions || this.audit.questions.length === 0) return 1;
    // Page 1: Info & Score
    // Page 2+: Questions
    const qCount = this.audit.questions.length;
    return 1 + Math.ceil(qCount / this.questionsPerPage);
  }

  get questionPages() {
    if (!this.audit?.questions) return [];
    const pages = [];
    for (let i = 0; i < this.audit.questions.length; i += this.questionsPerPage) {
      pages.push(this.audit.questions.slice(i, i + this.questionsPerPage));
    }
    return pages;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPrintDate() {
    return new Date().toLocaleDateString('fr-FR');
  }

  printReport() {
    const printContent = document.getElementById('report-content');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write("<html><head><title>Rapport d'Audit</title>");

    // Inject all existing styles and fonts
    const styles = document.head.querySelectorAll(
      'style, link[rel="stylesheet"], link[rel="preconnect"]',
    );
    styles.forEach((style) => {
      doc.write(style.outerHTML);
    });

    // Add specific print optimizations for the formal document
    doc.write(`
      <style>
        @page { size: auto; margin: 0; }
        body { 
          margin: 0; 
          padding: 0;
          background: #fff !important; 
          color: #000 !important; 
          font-family: 'Crimson Text', 'Times New Roman', serif;
          -webkit-print-color-adjust: exact; 
        }
        .page-content { 
           box-shadow: none !important; 
           margin: 0 !important; 
           padding: 1.5cm 2cm !important; 
           page-break-after: always; 
           width: 100% !important;
           max-width: none !important;
           min-height: 100vh !important;
           box-sizing: border-box;
        }
        .hidden-screen { display: block !important; }
        /* Remove any hidden visibility that might have applied */
        * { visibility: visible !important; }
      </style>
    `);

    doc.write('</head><body>');
    doc.write(printContent.innerHTML);
    doc.write('</body></html>');
    doc.close();

    // Print after allowing styles to render
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }

  getSelectedOptionLabel(question: any): string {
    const selectedId = question.optionChoisieId ?? question.selectedOptionId;
    const opt = question.options?.find((o: any) => o.id === selectedId);
    return opt ? opt.label : 'Non répondu';
  }

  getAuditScorePercentage(): number {
    if (!this.audit || !this.audit.questions?.length) return 0;
    return Math.round((this.audit.scoreTotal / this.audit.questions.length) * 100);
  }
}
