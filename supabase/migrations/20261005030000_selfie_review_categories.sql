-- Photo-specific correction reasons retain the existing review/reporting domain.
insert into public.booking_categories (code, domain, label) values
('selfie.unclear', 'document_review', 'Photo is blurry, dark or affected by glare'),
('selfie.face', 'document_review', 'Face is covered, cropped or not clearly visible'),
('selfie.id', 'document_review', 'ID is cropped, covered or unreadable in the photo'),
('selfie.missing', 'document_review', 'Photo does not show the customer holding their ID'),
('selfie.mismatch', 'document_review', 'Face or ID does not match the submitted identification'),
('selfie.unverifiable', 'document_review', 'Photo could not be verified'),
('selfie.other', 'document_review', 'Other selfie correction');
