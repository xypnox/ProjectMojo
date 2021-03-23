ALTER TABLE templates 
  ADD COLUMN owner_id INTEGER 
  REFERENCES users (id);
