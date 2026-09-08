import React, { useState, useEffect } from 'react';
import { midiService, MidiDevice } from '../../services/midiService';
import { Radio, X, CheckCircle2, AlertTriangle, Settings2, Sliders, Music, Volume2 } from 'lucide-react';

interface MidiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  midiMode: 'playback' | 'entry';
  onSetMidiMode: (mode: 'playback' | 'entry') => void;
  quantization: string;
  onSetQuantization: (q: string) => void;
  selectedChannel: number; // 0 = all/omni, 1-16
  onSetSelectedChannel: (ch: number) => void;
  velocitySensitive: boolean;
  onSetVelocitySensitive: (val: boolean) => void;
}

export const MidiDeviceModal: React.FC<MidiDeviceModalProps> = ({
  isOpen,
  onClose,
  midiMode,
  onSetMidiMode,
  quantization,
  onSetQuantization,
  selectedChannel,
  onSetSelectedChannel,
  velocitySensitive,
  onSetVelocitySensitive,
}) => {
  const [isSupported, setIsSupported] = useState(midiService.getIsSupported());
  const [devices, setDevices] = useState<MidiDevice[]>(midiService.getConnectedDevices());
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(midiService.getIsSupported());
    const unsub = midiService.onDevicesChange((devs) => {
      setDevices(devs);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const success = await midiService.initialize();
      if (success) {
        setStatusMessage('MIDI system ready. Looking for connected devices...');
      } else {
        setStatusMessage('Could not access Web MIDI. Please check browser permissions.');
      }
    } catch (e) {
      setStatusMessage('Error connecting to Web MIDI: ' + (e as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div
      id="midi-device-modal-backdrop"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
      onClick={onClose}
    >
      <div
        id="midi-device-modal"
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">Web MIDI Keyboard Setup</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Browser Support Check */}
          {!isSupported ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Web MIDI Unsupported</p>
                <p className="text-amber-800 leading-relaxed">
                  MIDI input is not supported in this browser environment. Please use a modern desktop browser such as Google Chrome, Microsoft Edge, or Opera to connect hardware MIDI keyboards.
                </p>
                <p className="mt-2 text-stone-600">
                  Tip: You can use our built-in <strong>Virtual Piano</strong> and computer keyboard shortcuts at any time!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Connected Devices List */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-stone-800">Connected MIDI Devices</span>
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="text-amber-700 hover:text-amber-900 font-semibold text-[11px]"
                  >
                    {isConnecting ? 'Scanning...' : 'Rescan / Connect'}
                  </button>
                </div>

                {devices.length === 0 ? (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg text-center space-y-2">
                    <p className="text-stone-500">No external MIDI devices detected yet.</p>
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="px-3 py-1.5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 shadow-2xs"
                    >
                      {isConnecting ? 'Detecting...' : 'Request MIDI Access'}
                    </button>
                    <p className="text-[10px] text-stone-600">
                      Connect a USB or Bluetooth MIDI keyboard and click allow when prompted.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {devices.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-emerald-950 block">{dev.name}</span>
                            <span className="text-[10px] text-emerald-700">{dev.manufacturer}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-800 font-semibold text-[10px]">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {statusMessage && (
                  <p className="text-[11px] text-stone-600 mt-1">{statusMessage}</p>
                )}
              </div>

              {/* MIDI Input Mode */}
              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <span className="font-bold text-stone-800 block">MIDI Input Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSetMidiMode('playback')}
                    className={`p-2.5 rounded-lg border text-left flex items-start space-x-2 transition-colors ${
                      midiMode === 'playback'
                        ? 'bg-amber-50 text-amber-950 border-amber-300 font-semibold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 mt-0.5 text-amber-600" />
                    <div>
                      <span className="block font-bold">Playback Audition</span>
                      <span className="text-[10px] text-stone-500">
                        Plays piano sound without writing to score.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => onSetMidiMode('entry')}
                    className={`p-2.5 rounded-lg border text-left flex items-start space-x-2 transition-colors ${
                      midiMode === 'entry'
                        ? 'bg-amber-50 text-amber-950 border-amber-300 font-semibold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <Music className="w-4 h-4 mt-0.5 text-amber-600" />
                    <div>
                      <span className="block font-bold">Note Entry Mode</span>
                      <span className="text-[10px] text-stone-500">
                        Inserts played pitches into selected measure.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantization & Channel Settings */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Quantization
                  </label>
                  <select
                    value={quantization}
                    onChange={(e) => onSetQuantization(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-md font-medium text-xs text-stone-800"
                  >
                    <option value="off">Off (Free Duration)</option>
                    <option value="quarter">Quarter Note (1/4)</option>
                    <option value="eighth">Eighth Note (1/8)</option>
                    <option value="sixteenth">16th Note (1/16)</option>
                    <option value="thirty_second">32nd Note (1/32)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    MIDI Channel
                  </label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => onSetSelectedChannel(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-md font-medium text-xs text-stone-800"
                  >
                    <option value="0">All Channels (Omni)</option>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((ch) => (
                      <option key={ch} value={ch}>
                        Channel {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Velocity Sensitivity Toggle */}
              <div className="pt-1 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-800 block">Velocity Sensitivity</span>
                  <span className="text-[10px] text-stone-500">
                    Key strike force affects note dynamic playback volume
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={velocitySensitive}
                  onChange={(e) => onSetVelocitySensitive(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 w-4 h-4 cursor-pointer"
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 text-xs shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
