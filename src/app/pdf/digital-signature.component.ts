import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '@syncfusion/ej2-buttons';
import { TextBox } from '@syncfusion/ej2-inputs';
import { PdfDocument, PdfSignatureField, PdfSignature, CryptographicStandard, DigestAlgorithm, PdfBitmap } from '@syncfusion/ej2-pdf';

/**
 * Options passed to `signPdf` describing how and where to sign a document.
 */
interface SignOptions {
	/** Optional rectangle for signature field placement on the page. */
	bounds?: { x?: number; y?: number; width?: number; height?: number };
	/** Optional name for the signature field. Defaults to 'Signature'. */
	fieldName?: string;
	/** Cryptographic standard as string ('CMS' or 'CAdES'). */
	crypto?: string | null;
	/** Digest algorithm as string (e.g. 'SHA256'). */
	digest?: string | null;
	/** PFX certificate data as raw bytes. */
	pfxData: Uint8Array;
	/** Password for the PFX certificate. */
	password: string;
	/** Optional contact info placed into the signature metadata. */
	contact?: string;
	/** Optional location metadata. */
	location?: string;
	/** Reason for signing, placed into the signature metadata. */
	reason?: string;
	/** Optional logo bytes to render into the signature appearance. */
	logoBytes?: Uint8Array;
	/** Optional placement rectangle for the logo inside the signature appearance. */
	logoRect?: { x?: number; y?: number; width?: number; height?: number };
	/** Filename to use when saving the signed PDF. */
	outputName: string;
	/** If true, mark the signature as a document certification (author). */
	author?: boolean;
}

@Component({
	selector: 'control-content',
	templateUrl: './digital-signature.html',
	standalone: true,
	imports: [FormsModule]
})
export class PdfSignComponent  implements OnInit {

	ngOnInit(): void {
		// Run basic initialization when the Angular component mounts.
		// The original sample exposed functions on `window`; we keep that
		// behavior so the sample UI (HTML) which expects those globals works.
		this.initialize();
		(window as any).default = this.initialize.bind(this);
	}

	initialize(): void {
		// Wire up Syncfusion `Button` instances used by the sample HTML.
		// These attach to elements by id and forward clicks to component methods.
		const createBtn = new Button();
		createBtn.appendTo('#createSignBtn');
		const signBtn = new Button({}, '#signExistingBtn');
		createBtn.element.onclick = () => this.createAndSignPdf();
		signBtn.element.onclick = () => this.signExistingPdf();

		// Initialize EJ2 TextBox components for inputs using demo-like features
		try {
			new TextBox({ cssClass: 'e-filled', placeholder: 'Password', type: 'password', width: '300px', showClearButton: false }, '#certPassword');
			new TextBox({ cssClass: 'e-filled', placeholder: 'Reason', width: '300px', showClearButton: true }, '#reason');
			new TextBox({ cssClass: 'e-filled', placeholder: 'Contact', width: '300px', showClearButton: true }, '#contact');
			new TextBox({ cssClass: 'e-filled', placeholder: 'Location', width: '300px', showClearButton: true }, '#location');
		} catch { }

		// Hook up file input UI to update chosen file names in the template
		const srcInput = document.getElementById('sourceFile') as HTMLInputElement | null;
		const certInput = document.getElementById('certFile') as HTMLInputElement | null;
		const srcNameSpan = document.getElementById('sourceFileName') as HTMLElement | null;
		const certNameSpan = document.getElementById('certFileName') as HTMLElement | null;
		if (srcInput && srcNameSpan) {
			srcInput.addEventListener('change', () => {
				const f = srcInput.files && srcInput.files[0];
				srcNameSpan.textContent = f ? f.name : 'No file chosen';
			});
		}
		if (certInput && certNameSpan) {
			certInput.addEventListener('change', () => {
				const f = certInput.files && certInput.files[0];
				certNameSpan.textContent = f ? f.name : 'No file chosen';
			});
		}

		// Also expose functions to `window` for compatibility with the
		// original non-Angular sample code that calls them directly.
		(window as any).createAndSignPdf = this.createAndSignPdf.bind(this);
		(window as any).signExistingPdf = this.signExistingPdf.bind(this);
	}

	signPdf(
		pdfBytes: Uint8Array,
		options: SignOptions
	): void {
		// Create a PdfDocument from raw bytes and place a signature field
		// on the first page using the provided options.
		const pdf = new PdfDocument(pdfBytes);
		const page = pdf.getPage(0);

		// Determine where to place the field; fall back to sensible defaults.
		const b = options.bounds ?? {};
		const sigX = typeof b.x === 'number' ? b.x : 20;
		const sigY = typeof b.y === 'number' ? b.y : 20;
		const sigW = typeof b.width === 'number' ? b.width : 200;
		const sigH = typeof b.height === 'number' ? b.height : 100;

		// Construct the interactive signature field object.
		const signatureField = new PdfSignatureField(page, options.fieldName || 'Signature', {
			x: sigX, y: sigY, width: sigW, height: sigH
		});

		// Convert sample string options into library enums and metadata.
		var sigOptions: any = {
			cryptographicStandard: this.mapCryptoStandard(options.crypto ?? 'CMS'),
			digestAlgorithm: this.mapDigestAlgorithm(options.digest ?? 'SHA256'),
			contactInfo: options.contact || '',
			locationInfo: options.location || '',
			reason: options.reason || ''
		};
		if (options.author === true) {
			// Mark the signature as a certification (author) signature.
			sigOptions.certify = true;
		}

		// Create a cryptographic signature object from the provided PFX
		// and assign it to the interactive field.
		const signature = PdfSignature.create(options.pfxData, options.password, sigOptions);
		signatureField.setSignature(signature);
		pdf.form.add(signatureField);

		// If a logo was supplied, render it into the signature appearance.
		if (options.logoBytes) {
			const app = signatureField.getAppearance();
			const lr = options.logoRect ?? {};
			const lx = typeof lr.x === 'number' ? lr.x : 20;
			const ly = typeof lr.y === 'number' ? lr.y : 20;
			const lw = typeof lr.width === 'number' ? lr.width : 120;
			const lh = typeof lr.height === 'number' ? lr.height : 50;
			const logoBmp = new PdfBitmap(options.logoBytes);
			app.normal.graphics.drawImage(logoBmp, { x: lx, y: ly, width: lw, height: lh });
		}

		// Persist the signed document to the client (downloads using the
		// library's default save behavior) and release memory.
		pdf.save(options.outputName);
		pdf.destroy();
	}

	getSelectedRadio(name: string): string | null {
		// Read the currently selected radio input value for a given name.
		const el = document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null;
		return el ? el.value : null;
	}

	mapCryptoStandard(val: string | null): CryptographicStandard {
		// Map the sample string to the library enum for cryptographic standard.
		return val === 'CAdES' ? CryptographicStandard.cades : CryptographicStandard.cms;
	}

	mapDigestAlgorithm(val: string | null): DigestAlgorithm {
		// Map digest algorithm name string to the corresponding enum.
		switch (val) {
			case 'SHA1': return DigestAlgorithm.sha1;
			case 'SHA384': return DigestAlgorithm.sha384;
			case 'SHA512': return DigestAlgorithm.sha512;
			case 'RIPEMD160': return DigestAlgorithm.ripemd160;
			default: return DigestAlgorithm.sha256;
		}
	}

	async readFromPdfResources(fileName: string): Promise<Uint8Array> {
		// Helper to fetch a remote resource and return its raw bytes.
		const res = await fetch(fileName);
		if (!res.ok) throw new Error(`Failed to fetch ${fileName}: ${res.status} ${res.statusText}`);
		const buf = await res.arrayBuffer();
		return new Uint8Array(buf);
	}

	async createAndSignPdf(): Promise<void> {
		// Create a new PDF (fetched from remote sample resources) and sign it
		// using a sample PFX and logo included in the CDN resources.
		const crypto = this.getSelectedRadio('cryptoStandard');
		const digest = this.getSelectedRadio('digestAlgo');
		const sigType = this.getSelectedRadio('signatureType');
		const [pdfBytes, pfxBytes, logoBytes] = await Promise.all([
			this.readFromPdfResources('https://cdn.syncfusion.com/content/pdf-resources/pdf-succinctly.pdf'),
			this.readFromPdfResources('https://cdn.syncfusion.com/content/pdf-resources/PDF.pfx'),
			this.readFromPdfResources('https://cdn.syncfusion.com/content/pdf-resources/logo.png')
		]);

		// Use a known test password from the sample; in production this
		// should be provided securely by the user.
		this.signPdf(pdfBytes, {
			crypto,
			digest,
			pfxData: pfxBytes,
			password: 'password123',
			contact: 'johndoe@owned.us',
			location: 'Honolulu, Hawaii',
			reason: sigType === 'Author' ? 'I am author of this document.' : 'Approved.',
			logoBytes,
			outputName: 'SignedPDF.pdf',
			author: sigType === 'Author'
		});
	}

	ensureNoteHost(): HTMLDivElement {
		// Ensure an element exists to show validation or error notes to the user.
		let host = document.getElementById('noteMessage') as HTMLDivElement | null;
		if (!host) {
			host = document.createElement('div');
			host.id = 'noteMessage';
			host.style.display = 'none';
			host.style.color = '#b00020';
			host.style.fontWeight = '600';
			host.style.margin = '8px 0';
			host.setAttribute('role', 'alert');
			host.setAttribute('aria-live', 'assertive');
			const controlSection = document.querySelector('.control-section') as HTMLElement | null || document.body;
			controlSection.insertBefore(host, controlSection.firstChild);
		}
		return host;
	}

	showNote(msg: string) {
		// Display a short message for the user (validation/error/etc.).
		const noteEl = this.ensureNoteHost();
		noteEl.textContent = msg;
		noteEl.style.display = 'block';
		try { noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { }
	}

	hideNote() {
		// Hide the previously shown note element.
		const noteEl = document.getElementById('noteMessage') as HTMLDivElement | null;
		if (noteEl) noteEl.style.display = 'none';
	}

	async signExistingPdf(): Promise<void> {
		// Sign a user-supplied PDF using a user-supplied certificate file.
		// Read UI controls (file inputs and text inputs) and validate them
		// before attempting to sign.
		const crypto = this.getSelectedRadio('cryptoStandard');
		const digest = this.getSelectedRadio('digestAlgo');
		const sourceInput = document.getElementById('sourceFile') as HTMLInputElement | null;
		const certInput = document.getElementById('certFile') as HTMLInputElement | null;
		const passwordEl = document.getElementById('certPassword') as HTMLInputElement | null;
		const reasonEl = document.getElementById('reason') as HTMLInputElement | null;
		const contactEl = document.getElementById('contact') as HTMLInputElement | null;
		const locationEl = document.getElementById('location') as HTMLInputElement | null;

		const password = (passwordEl?.value || '').trim();
		const reason = (reasonEl?.value || '').trim();
		const contact = (contactEl?.value || '').trim();
		const location = (locationEl?.value || '').trim();

		// Basic validation: ensure files are chosen and text fields are filled.
		const hasSource = !!sourceInput?.files?.length;
		const hasCert = !!certInput?.files?.length;
		const allOk = hasSource && hasCert && password && reason && contact && location;
		if (!allOk) {
			this.showNote('NOTE: Fill all fields and then create PDF');
			return;
		}
		this.hideNote();

		const sourceFile = sourceInput!.files![0];
		const certFile = certInput!.files![0];
		try {
			// Read the binary contents of both files and the remote logo.
			const [srcBuf, pfxBuf, logoBytes] = await Promise.all([
				sourceFile.arrayBuffer(),
				certFile.arrayBuffer(),
				this.readFromPdfResources('https://cdn.syncfusion.com/content/pdf-resources/logo.png')
			]);
			const pdfBytes = srcBuf instanceof Uint8Array ? srcBuf : new Uint8Array(srcBuf);
			const pfxBytes = pfxBuf instanceof Uint8Array ? pfxBuf : new Uint8Array(pfxBuf);

			// Invoke the signing routine with the uploaded certificate and user input.
			this.signPdf(pdfBytes, {
				crypto,
				digest,
				pfxData: pfxBytes,
				password,
				contact,
				location,
				reason,
				logoBytes,
				outputName: 'SignedPDF.pdf'
			});
		} catch (err: any) {
			// Surface any read/sign errors to the user.
			this.showNote(err?.message || 'Error while signing existing PDF.');
		}
	}
}

