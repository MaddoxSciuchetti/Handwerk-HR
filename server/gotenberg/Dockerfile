FROM gotenberg/gotenberg:8

USER root
COPY document-fonts/ /usr/local/share/fonts/carlito/
COPY gotenberg/99-carlito-aliases.conf /etc/fonts/conf.d/99-carlito-aliases.conf
COPY gotenberg/start.sh /usr/local/bin/start-gotenberg.sh
RUN chmod +x /usr/local/bin/start-gotenberg.sh && fc-cache -f
USER gotenberg

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "/usr/local/bin/start-gotenberg.sh"]
