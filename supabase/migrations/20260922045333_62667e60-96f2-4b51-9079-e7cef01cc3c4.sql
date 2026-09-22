ALTER TABLE public.umrah_documents DROP CONSTRAINT IF EXISTS umrah_documents_document_type_check;

UPDATE public.umrah_documents SET document_type = 'id_card_front' WHERE document_type = 'identification';

ALTER TABLE public.umrah_documents
  ADD CONSTRAINT umrah_documents_document_type_check
  CHECK (document_type IN ('passport','id_card_front','id_card_back','photograph','other'));