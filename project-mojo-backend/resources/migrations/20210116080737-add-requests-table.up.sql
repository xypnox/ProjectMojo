CREATE TABLE requests
(id SERIAL,
 userid INT,
 url VARCHAR(1000) NOT NULL,
 request_method VARCHAR(12) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_userid
   FOREIGN KEY(userid)
      REFERENCES users(id));
