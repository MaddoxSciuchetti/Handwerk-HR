# Backup

Backups are handled through Neon’s managed backup and restore features. The production branch supports point-in-time restore, allowing the database to be restored to an earlier timestamp. This protects against accidental deletes, failed migrations, or corrupted writes.

Logical dumps with pg_dump could also be scheduled for leng term safety, however they are not the main recovery mechanism as they become slower when they grow and Neons build in option provides a easy to maintain backup option. If in the future the importance of the data stored becomes higher it can make sense to create dumps once in a while to ensure complete safetey and not be bound to Neon.
