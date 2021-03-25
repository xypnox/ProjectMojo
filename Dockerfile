FROM openjdk:8-alpine

RUN apk add --no-cache file
RUN apk --update add librsvg

# Install msft fonts
RUN apk --no-cache add msttcorefonts-installer fontconfig && \
    update-ms-fonts && \
    fc-cache -f


# Install Google fonts - for reference
# ------------------------------------
# RUN wget https://github.com/google/fonts/archive/master.tar.gz -O gf.tar.gz
# RUN tar -xf gf.tar.gz
# RUN mkdir -p /usr/share/fonts/truetype/google-fonts
# RUN find $PWD/fonts-master/ -name "*.ttf" -exec install -m644 {} /usr/share/fonts/truetype/google-fonts/ \; || return 1
# RUN rm -f gf.tar.gz
# RUN fc-cache -f && rm -rf /var/cache/*


COPY ./project-mojo-backend/ /app

WORKDIR /app

#RUN lein uberjar

EXPOSE 5000

# Hyphens in names is not allowed in jar.
CMD java -jar target/uberjar/project_mojo_backend.jar
