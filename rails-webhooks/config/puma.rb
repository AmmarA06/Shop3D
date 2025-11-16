# Puma configuration file

# Specifies the `port` that Puma will listen on to receive requests
port ENV.fetch("PORT") { 4000 }

# Specifies the `environment` that Puma will run in
environment ENV.fetch("RAILS_ENV") { "development" }

# Specifies the number of `workers` to boot in clustered mode
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# Use the `preload_app!` method when specifying a `workers` number
preload_app!

# Allow puma to be restarted by `bin/rails restart` command
plugin :tmp_restart

# Specify the PID file
pidfile ENV.fetch("PIDFILE") { "tmp/pids/server.pid" }

# Logging
stdout_redirect(
  ENV.fetch("STDOUT_PATH") { "log/puma.stdout.log" },
  ENV.fetch("STDERR_PATH") { "log/puma.stderr.log" },
  true
) unless ENV["RAILS_ENV"] == "development"

